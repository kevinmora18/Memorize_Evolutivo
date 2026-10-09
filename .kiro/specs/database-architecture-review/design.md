# Design Document: Database Architecture Review System

## Overview

El sistema de revisión de arquitectura de base de datos (Review_System) es una herramienta de análisis estático que compara dos esquemas de base de datos, identifica diferencias arquitectónicas, evalúa patrones de diseño, y genera un reporte completo con recomendaciones priorizadas. El sistema está diseñado específicamente para analizar la base de datos del videojuego educativo Memorize, comparando su implementación actual de 7 tablas contra el diseño completo de 26 tablas.

## Architecture

### System Components

El Review_System se compone de los siguientes módulos principales:

```
┌─────────────────────────────────────────────────────────────┐
│                     Review System Core                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Schema     │  │ Relationship │  │ Normalization│      │
│  │   Parser     │──▶│   Analyzer   │──▶│   Analyzer   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────────────────────────────────────────┐      │
│  │           Analysis Results Repository            │      │
│  └──────────────────────────────────────────────────┘      │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Performance  │  │   Security   │  │  Migration   │      │
│  │   Analyzer   │  │   Analyzer   │  │   Planner    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                           │                                  │
│                           ▼                                  │
│                  ┌──────────────┐                           │
│                  │ Prioritizer  │                           │
│                  └──────────────┘                           │
│                           │                                  │
│                           ▼                                  │
│                  ┌──────────────┐                           │
│                  │   Reporter   │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

### 1. Schema Parser

**Responsibility:** Cargar y parsear esquemas de base de datos desde múltiples formatos (Prisma, DBML).

**Input:**
- Archivo de esquema Prisma (Current_Schema)
- Archivo de esquema DBML (Complete_Schema)

**Output:**
- Representación interna unificada de esquemas (Abstract Schema Tree)

**Key Operations:**
```typescript
interface SchemaParser {
  parsePrismaSchema(filePath: string): Schema;
  parseDBMLSchema(filePath: string): Schema;
  normalizeSchema(rawSchema: RawSchema): Schema;
}

interface Schema {
  tables: Map<string, Table>;
  relationships: Relationship[];
  indexes: Index[];
  enums: EnumDefinition[];
  metadata: SchemaMetadata;
}

interface Table {
  name: string;
  fields: Field[];
  primaryKey: PrimaryKey;
  indexes: Index[];
  constraints: Constraint[];
  annotations: Annotation[];
}

interface Field {
  name: string;
  type: DataType;
  nullable: boolean;
  defaultValue?: any;
  unique: boolean;
  indexed: boolean;
  references?: Reference;
  annotations: Annotation[];
}
```

**Implementation Notes:**
- Utilizar parser de Prisma oficial para esquemas Prisma
- Implementar parser DBML custom o utilizar librería dbml-parser
- Normalizar ambos formatos a una representación interna común
- Preservar anotaciones y comentarios para análisis contextual

### 2. Relationship Analyzer

**Responsibility:** Identificar y clasificar todas las relaciones entre tablas, validar su correcta implementación.

**Input:**
- Schema (Abstract Schema Tree)

**Output:**
- RelationshipReport: lista de relaciones con clasificación y validación

**Key Operations:**
```typescript
interface RelationshipAnalyzer {
  identifyRelationships(schema: Schema): Relationship[];
  classifyRelationshipType(relationship: Relationship): RelationType;
  validateRelationshipConstraints(relationship: Relationship): ValidationResult[];
  detectOrphanedTables(schema: Schema): Table[];
  analyzeRelationshipPerformance(relationship: Relationship): PerformanceIssue[];
}

enum RelationType {
  ONE_TO_ONE = "1:1",
  ONE_TO_MANY = "1:N",
  MANY_TO_MANY = "N:N"
}

interface Relationship {
  type: RelationType;
  sourceTable: string;
  targetTable: string;
  sourceField: string;
  targetField: string;
  cascadeDelete: boolean;
  cascadeUpdate: boolean;
  indexed: boolean;
  bidirectional: boolean;
}

interface ValidationResult {
  valid: boolean;
  issue?: string;
  severity: "error" | "warning" | "info";
  recommendation?: string;
}
```

**Validation Rules:**
- **1:1 Relationships:** Verificar UNIQUE constraint en foreign key
- **1:N Relationships:** Verificar foreign key en tabla "many-side"
- **N:N Relationships:** Detectar missing junction tables
- **Indexing:** Foreign keys deben tener índices
- **Cascade:** Validar que cascade delete sea apropiado según lógica de negocio

### 3. Normalization Analyzer

**Responsibility:** Evaluar el nivel de normalización de cada tabla y detectar violaciones.

**Input:**
- Table definition

**Output:**
- NormalizationReport: nivel de normalización y violaciones detectadas

**Key Operations:**
```typescript
interface NormalizationAnalyzer {
  assessNormalizationLevel(table: Table): NormalizationLevel;
  detect3NFViolations(table: Table): Violation[];
  detectRepeatedPatterns(schema: Schema): Pattern[];
  analyzeArrayFields(table: Table): ArrayFieldAnalysis[];
  recommendDenormalization(schema: Schema, queryPatterns: QueryPattern[]): DenormalizationRecommendation[];
}

enum NormalizationLevel {
  FIRST_NF = "1NF",
  SECOND_NF = "2NF",
  THIRD_NF = "3NF",
  BCNF = "BCNF"
}

interface Violation {
  type: "functional_dependency" | "transitive_dependency" | "partial_dependency";
  fields: string[];
  description: string;
  recommendation: string;
}

interface ArrayFieldAnalysis {
  field: string;
  shouldNormalize: boolean;
  estimatedRelationshipType: RelationType;
  reasoning: string;
}
```

**Detection Heuristics:**
- **1NF:** Detectar array fields que representen entidades relacionadas
- **2NF:** Detectar dependencias parciales de claves compuestas
- **3NF:** Detectar dependencias transitivas (A → B → C)
- **Strategic Denormalization:** Recomendar cuando query performance lo justifique

### 4. Performance Analyzer

**Responsibility:** Analizar índices, identificar cuellos de botella de performance.

**Input:**
- Schema + Query Patterns (opcional)

**Output:**
- PerformanceReport: problemas de performance e índices recomendados

**Key Operations:**
```typescript
interface PerformanceAnalyzer {
  analyzeIndexCoverage(schema: Schema): IndexCoverageReport;
  identifyMissingIndexes(schema: Schema): IndexRecommendation[];
  detectOverIndexing(table: Table): OverIndexingIssue[];
  analyzeQueryPatterns(schema: Schema, patterns: QueryPattern[]): QueryOptimization[];
  identifyNPlusOneRisks(relationships: Relationship[]): NPlusOneRisk[];
  recommendPartitioning(tables: Table[]): PartitioningRecommendation[];
}

interface IndexRecommendation {
  table: string;
  fields: string[];
  type: "single" | "composite" | "partial";
  reasoning: string;
  estimatedImpact: "high" | "medium" | "low";
}

interface QueryOptimization {
  pattern: string;
  currentPerformance: "poor" | "acceptable" | "good";
  recommendations: string[];
  proposedIndexes: IndexRecommendation[];
}

interface NPlusOneRisk {
  relationship: Relationship;
  severity: "high" | "medium" | "low";
  mitigation: string[];
}
```

**Analysis Strategies:**
- **Missing FK Indexes:** Verificar que todos los foreign keys tengan índices
- **High Cardinality Fields:** Identificar campos con alta cardinalidad sin índice
- **Composite Index Opportunities:** Analizar patrones WHERE multi-campo
- **Over-indexing:** Detectar tablas con >5 índices que impacten writes
- **N+1 Detection:** Identificar relaciones 1:N sin eager loading strategy

### 5. Security Analyzer

**Responsibility:** Evaluar aspectos de seguridad y protección de datos.

**Input:**
- Schema

**Output:**
- SecurityReport: vulnerabilidades y recomendaciones de seguridad

**Key Operations:**
```typescript
interface SecurityAnalyzer {
  identifySensitiveFields(schema: Schema): SensitiveField[];
  evaluateDeletePatterns(tables: Table[]): DeletePatternAnalysis[];
  analyzeAuditTrail(schema: Schema): AuditAnalysis;
  assessGDPRCompliance(schema: Schema): GDPRReport;
  evaluateAccessControl(schema: Schema): AccessControlAnalysis;
}

interface SensitiveField {
  table: string;
  field: string;
  dataType: "credential" | "pii" | "financial" | "health";
  encrypted: boolean;
  recommendation: string;
}

interface DeletePatternAnalysis {
  table: string;
  pattern: "hard_delete" | "soft_delete" | "none";
  hasDeletedAtField: boolean;
  recommendation: string;
  reasoning: string;
}

interface AuditAnalysis {
  tablesWithAudit: string[];
  tablesWithoutAudit: string[];
  auditCompleteness: number; // 0-100%
  recommendations: string[];
}

interface GDPRReport {
  userDataTables: string[];
  missingRightToErasure: string[];
  missingDataExport: string[];
  recommendations: string[];
}
```

**Security Patterns:**
- **Sensitive Data:** Email, password, payment info → encriptar
- **Soft Delete:** Tablas con user data → implementar soft delete
- **Audit Trail:** Tablas críticas → createdAt, updatedAt, createdBy
- **GDPR:** User data → capacidad de borrado y exportación
- **Row-Level Security:** Multi-tenant tables → RLS policies

### 6. Migration Planner

**Responsibility:** Generar plan de migración secuencial desde Current_Schema a Complete_Schema.

**Input:**
- Current_Schema
- Complete_Schema
- DependencyGraph

**Output:**
- MigrationPlan: secuencia ordenada de cambios con scripts

**Key Operations:**
```typescript
interface MigrationPlanner {
  generateMigrationPlan(current: Schema, target: Schema): MigrationPlan;
  detectBreakingChanges(migration: MigrationStep): boolean;
  estimateComplexity(migration: MigrationStep): ComplexityEstimate;
  identifyZeroDowntimePath(migration: MigrationStep): boolean;
  generateRollbackProcedure(migration: MigrationStep): RollbackProcedure;
}

interface MigrationPlan {
  steps: MigrationStep[];
  totalEstimatedTime: string;
  breakingChanges: MigrationStep[];
  dependencyOrder: string[];
}

interface MigrationStep {
  id: string;
  type: "add_table" | "add_column" | "add_index" | "modify_column" | "add_relationship";
  description: string;
  sql: string;
  dataScript?: string;
  dependencies: string[];
  complexity: ComplexityEstimate;
  breakingChange: boolean;
  zeroDowntime: boolean;
  rollback: RollbackProcedure;
  testingStrategy: string[];
}

interface ComplexityEstimate {
  level: "trivial" | "simple" | "moderate" | "complex" | "high_risk";
  estimatedMinutes: number;
  factors: string[];
}

interface RollbackProcedure {
  sql: string;
  dataRestoration?: string;
  validations: string[];
}
```

**Migration Strategy:**
- **Phase 1: Non-breaking additions** (nuevas tablas, nuevos campos nullable)
- **Phase 2: Index creation** (mejora performance sin romper nada)
- **Phase 3: Data migrations** (mover data, populate nuevos campos)
- **Phase 4: Constraint additions** (agregar NOT NULL, unique, etc.)
- **Phase 5: Breaking changes** (remove deprecated fields/tables)

**Dependency Resolution:**
```
1. Independent tables (no FK) → can be added in parallel
2. Tables with FK → must add referenced table first
3. Junction tables → must add both parent tables first
4. Indexes → can be added after table/column exists
```

### 7. Prioritizer

**Responsibility:** Asignar prioridades a todas las recomendaciones según múltiples factores.

**Input:**
- All analysis results

**Output:**
- PrioritizedRecommendations: lista ordenada con rationale

**Key Operations:**
```typescript
interface Prioritizer {
  prioritizeRecommendations(findings: Finding[]): PrioritizedRecommendation[];
  calculatePriorityScore(finding: Finding): number;
  groupIntoPhases(recommendations: PrioritizedRecommendation[]): Phase[];
  identifyQuickWins(recommendations: PrioritizedRecommendation[]): PrioritizedRecommendation[];
  recommendMVP(recommendations: PrioritizedRecommendation[]): MVPRecommendation;
}

interface Finding {
  id: string;
  type: "gap" | "performance" | "security" | "normalization" | "scalability";
  description: string;
  dataIntegrityImpact: number; // 0-10
  performanceImpact: number; // 0-10
  securityImpact: number; // 0-10
  implementationComplexity: number; // 0-10
  featureCompletenessImpact: number; // 0-10
}

interface PrioritizedRecommendation {
  finding: Finding;
  priority: "critical" | "high" | "medium" | "low";
  score: number;
  rationale: string;
  estimatedEffort: string;
  quickWin: boolean;
}

interface Phase {
  name: string;
  recommendations: PrioritizedRecommendation[];
  totalEffort: string;
  goals: string[];
}

interface MVPRecommendation {
  tables: string[];
  features: string[];
  rationale: string;
  excludedFeatures: string[];
}
```

**Priority Scoring Algorithm:**
```typescript
function calculatePriorityScore(finding: Finding): number {
  const weights = {
    dataIntegrity: 3.0,    // Highest weight
    security: 2.5,
    performance: 2.0,
    featureCompleteness: 1.5,
    complexity: -1.0       // Negative weight (higher complexity = lower priority)
  };
  
  const score = 
    finding.dataIntegrityImpact * weights.dataIntegrity +
    finding.securityImpact * weights.security +
    finding.performanceImpact * weights.performance +
    finding.featureCompletenessImpact * weights.featureCompleteness +
    finding.implementationComplexity * weights.complexity;
  
  return score;
}

function categorizePriority(score: number): Priority {
  if (score >= 20) return "critical";
  if (score >= 12) return "high";
  if (score >= 6) return "medium";
  return "low";
}
```

**Quick Win Criteria:**
- `implementationComplexity <= 3`
- `(performanceImpact >= 6 OR securityImpact >= 6)`
- No breaking changes
- No dependencies on other changes

### 8. Reporter

**Responsibility:** Generar reporte final en múltiples formatos con visualizaciones.

**Input:**
- All analysis results
- Prioritized recommendations

**Output:**
- Comprehensive report (Markdown, HTML, PDF)

**Key Operations:**
```typescript
interface Reporter {
  generateExecutiveSummary(results: AnalysisResults): string;
  generateDetailedFindings(results: AnalysisResults): DetailedReport;
  generateRelationshipDiagram(schema: Schema): Diagram;
  generateMigrationRoadmap(plan: MigrationPlan): Roadmap;
  generateCodeExamples(recommendations: PrioritizedRecommendation[]): CodeExample[];
  generateImplementationChecklist(phase: Phase): Checklist;
}

interface DetailedReport {
  executiveSummary: string;
  schemaComparison: ComparisonSection;
  relationships: RelationshipSection;
  normalization: NormalizationSection;
  performance: PerformanceSection;
  security: SecuritySection;
  migrationPlan: MigrationSection;
  prioritizedRecommendations: RecommendationSection;
  appendix: AppendixSection;
}

interface ComparisonSection {
  tablesPresent: string[];
  tablesMissing: string[];
  fieldMismatches: FieldMismatch[];
  visualComparison: Table;
}

interface CodeExample {
  recommendation: string;
  currentCode: string;
  recommendedCode: string;
  language: "prisma" | "sql" | "typescript";
  explanation: string;
}

interface Checklist {
  phase: string;
  items: ChecklistItem[];
}

interface ChecklistItem {
  task: string;
  completed: boolean;
  dependencies: string[];
  estimatedTime: string;
}
```

**Report Structure:**
```markdown
# Database Architecture Review - Memorize Game

## Executive Summary
- High-level findings
- Critical issues count
- Recommended next steps

## 1. Schema Comparison
- Current vs Complete schema overview
- Gap analysis
- Visual comparison table

## 2. Relationship Analysis
- Relationship diagram
- Validation results
- Missing relationships

## 3. Normalization Analysis
- Normalization violations
- Repeated patterns
- Denormalization opportunities

## 4. Performance Analysis
- Index coverage
- Missing indexes
- Query optimization opportunities
- N+1 risks

## 5. Security Analysis
- Sensitive data handling
- Audit trail gaps
- GDPR compliance
- Access control

## 6. Migration Plan
- Phase breakdown
- Migration scripts
- Rollback procedures
- Testing strategies

## 7. Prioritized Recommendations
- Critical (P0)
- High (P1)
- Medium (P2)
- Low (P3)
- Quick Wins

## 8. Implementation Roadmap
- Phase 1: Foundation
- Phase 2: Core Features
- Phase 3: Advanced Features
- Phase 4: Optimization

## Appendix
- Complete table definitions
- Code examples
- Best practices references
```

## Data Models

### Core Data Structures

```typescript
// Schema representation
interface Schema {
  tables: Map<string, Table>;
  relationships: Relationship[];
  indexes: Index[];
  enums: EnumDefinition[];
  metadata: SchemaMetadata;
}

interface Table {
  name: string;
  fields: Field[];
  primaryKey: PrimaryKey;
  indexes: Index[];
  constraints: Constraint[];
  annotations: Annotation[];
  functionalArea: string; // "auth", "gameplay", "social", etc.
  estimatedRowCount?: number;
  growthPattern?: "bounded" | "linear" | "exponential";
}

interface Field {
  name: string;
  type: DataType;
  nullable: boolean;
  defaultValue?: any;
  unique: boolean;
  indexed: boolean;
  references?: Reference;
  annotations: Annotation[];
  sensitivityLevel?: "public" | "internal" | "confidential" | "restricted";
}

interface Relationship {
  id: string;
  type: RelationType;
  sourceTable: string;
  targetTable: string;
  sourceField: string;
  targetField: string;
  cascadeDelete: boolean;
  cascadeUpdate: boolean;
  indexed: boolean;
  bidirectional: boolean;
  validated: boolean;
  issues: ValidationResult[];
}

// Analysis results
interface AnalysisResults {
  schemaComparison: SchemaComparisonResult;
  relationshipAnalysis: RelationshipAnalysisResult;
  normalizationAnalysis: NormalizationAnalysisResult;
  performanceAnalysis: PerformanceAnalysisResult;
  securityAnalysis: SecurityAnalysisResult;
  migrationPlan: MigrationPlan;
  timestamp: Date;
}

interface SchemaComparisonResult {
  currentTables: string[];
  completeTables: string[];
  missingTables: string[];
  matchingTables: string[];
  fieldMismatches: FieldMismatch[];
  categorizedGaps: Map<string, string[]>; // functional area → missing tables
}

interface FieldMismatch {
  table: string;
  field: string;
  currentType?: DataType;
  completeType?: DataType;
  currentConstraints: Constraint[];
  completeConstraints: Constraint[];
  severity: "breaking" | "non-breaking";
}
```

## Component Interfaces

### SchemaParser Interface

```typescript
interface SchemaParser {
  parsePrismaSchema(filePath: string): Schema;
  parseDBMLSchema(filePath: string): Schema;
  normalizeSchema(rawSchema: RawSchema): Schema;
  validateSchema(schema: Schema): SchemaValidationResult;
}

// Usage example
const parser = new SchemaParser();
const currentSchema = parser.parsePrismaSchema("./prisma/schema.prisma");
const completeSchema = parser.parseDBMLSchema("./docs/complete-schema.dbml");
```

### Analyzer Pipeline

```typescript
interface AnalyzerPipeline {
  runFullAnalysis(current: Schema, complete: Schema): AnalysisResults;
  runSchemaComparison(current: Schema, complete: Schema): SchemaComparisonResult;
  runRelationshipAnalysis(schema: Schema): RelationshipAnalysisResult;
  runNormalizationAnalysis(schema: Schema): NormalizationAnalysisResult;
  runPerformanceAnalysis(schema: Schema): PerformanceAnalysisResult;
  runSecurityAnalysis(schema: Schema): SecurityAnalysisResult;
}

// Usage example
const pipeline = new AnalyzerPipeline();
const results = pipeline.runFullAnalysis(currentSchema, completeSchema);
```

### Report Generator Interface

```typescript
interface ReportGenerator {
  generateMarkdownReport(results: AnalysisResults): string;
  generateHTMLReport(results: AnalysisResults): string;
  generatePDFReport(results: AnalysisResults): Buffer;
  generateJSONReport(results: AnalysisResults): object;
  saveReport(report: string, format: "md" | "html" | "pdf", path: string): void;
}

// Usage example
const generator = new ReportGenerator();
const markdown = generator.generateMarkdownReport(results);
generator.saveReport(markdown, "md", "./reports/db-review.md");
```

## Game-Specific Analysis

### Feature-to-Table Mapping

El sistema debe mapear features del juego a sus tablas correspondientes:

```typescript
interface GameFeatureMapping {
  feature: string;
  requiredTables: string[];
  optionalTables: string[];
  currentSupport: "complete" | "partial" | "missing";
  gaps: string[];
}

const GAME_FEATURES: GameFeatureMapping[] = [
  {
    feature: "Classic Mode",
    requiredTables: ["User", "Match", "PlayerStats"],
    optionalTables: ["Achievement", "Leaderboard"],
    currentSupport: "complete",
    gaps: []
  },
  {
    feature: "Infinite Mode",
    requiredTables: ["User", "Match", "InfiniteScore"],
    optionalTables: ["Leaderboard"],
    currentSupport: "missing",
    gaps: ["InfiniteScore table not implemented"]
  },
  {
    feature: "Boss Battle Mode",
    requiredTables: ["User", "Match", "Boss", "BossEncounter"],
    optionalTables: ["Achievement"],
    currentSupport: "missing",
    gaps: ["Boss and BossEncounter tables not implemented"]
  },
  {
    feature: "Multiplayer",
    requiredTables: ["User", "Room", "RoomParticipant", "MultiplayerMatch"],
    optionalTables: ["Chat", "Invite"],
    currentSupport: "missing",
    gaps: ["All multiplayer tables missing"]
  },
  {
    feature: "Progression System",
    requiredTables: ["User", "PlayerStats", "Level", "Experience"],
    optionalTables: ["Achievement", "Reward"],
    currentSupport: "partial",
    gaps: ["Level and Experience tables not implemented"]
  },
  {
    feature: "Inventory & Cosmetics",
    requiredTables: ["User", "Inventory", "CosmeticItem"],
    optionalTables: ["Shop", "Currency"],
    currentSupport: "partial",
    gaps: ["CosmeticItem table present in Complete_Schema but missing linking"]
  },
  {
    feature: "Leaderboards",
    requiredTables: ["User", "Leaderboard", "LeaderboardEntry"],
    optionalTables: ["Season"],
    currentSupport: "missing",
    gaps: ["Leaderboard system not implemented"]
  },
  {
    feature: "Achievements",
    requiredTables: ["User", "Achievement", "PlayerAchievement"],
    optionalTables: ["AchievementCategory"],
    currentSupport: "missing",
    gaps: ["Achievement system not implemented"]
  },
  {
    feature: "Social Features",
    requiredTables: ["User", "Friendship", "Friend"],
    optionalTables: ["Chat", "Notification"],
    currentSupport: "missing",
    gaps: ["Friend system not implemented"]
  }
];
```

### Feature Analysis Algorithm

```typescript
interface GameFeatureAnalyzer {
  analyzeFeatureSupport(schema: Schema, features: GameFeatureMapping[]): FeatureSupportReport;
  prioritizeFeatures(features: GameFeatureMapping[]): PrioritizedFeature[];
  generateFeatureRoadmap(features: GameFeatureMapping[]): FeatureRoadmap;
}

interface FeatureSupportReport {
  completeFeatures: string[];
  partialFeatures: string[];
  missingFeatures: string[];
  totalCoverage: number; // 0-100%
  recommendations: FeatureRecommendation[];
}

interface FeatureRecommendation {
  feature: string;
  priority: "critical" | "high" | "medium" | "low";
  requiredTables: string[];
  estimatedEffort: string;
  rationale: string;
}
```

## Error Handling

### Error Types

```typescript
enum AnalysisErrorType {
  SCHEMA_PARSE_ERROR = "schema_parse_error",
  INVALID_SCHEMA = "invalid_schema",
  RELATIONSHIP_VALIDATION_ERROR = "relationship_validation_error",
  MIGRATION_GENERATION_ERROR = "migration_generation_error",
  REPORT_GENERATION_ERROR = "report_generation_error"
}

interface AnalysisError {
  type: AnalysisErrorType;
  message: string;
  context?: any;
  recoverable: boolean;
  suggestion?: string;
}

class AnalysisException extends Error {
  constructor(
    public errorType: AnalysisErrorType,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = "AnalysisException";
  }
}
```

### Error Recovery

```typescript
interface ErrorRecovery {
  handleParseError(error: AnalysisError): Schema | null;
  handleValidationError(error: AnalysisError): void;
  handleMigrationError(error: AnalysisError): MigrationPlan | null;
  logError(error: AnalysisError): void;
}

// Example error handling
try {
  const schema = parser.parsePrismaSchema(filePath);
} catch (error) {
  if (error instanceof AnalysisException) {
    if (error.recoverable) {
      // Attempt recovery
      const partialSchema = errorRecovery.handleParseError({
        type: error.errorType,
        message: error.message,
        context: error.context,
        recoverable: true
      });
      // Continue with partial schema
    } else {
      // Fatal error, abort analysis
      throw error;
    }
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// Example unit test structure
describe("RelationshipAnalyzer", () => {
  describe("identifyRelationships", () => {
    it("should identify 1:1 relationships with UNIQUE constraint", () => {
      const schema = createMockSchema([
        {
          name: "User",
          fields: [
            { name: "id", type: "Int", primaryKey: true },
            { name: "profileId", type: "Int", unique: true, references: "Profile" }
          ]
        },
        {
          name: "Profile",
          fields: [
            { name: "id", type: "Int", primaryKey: true }
          ]
        }
      ]);
      
      const analyzer = new RelationshipAnalyzer();
      const relationships = analyzer.identifyRelationships(schema);
      
      expect(relationships).toHaveLength(1);
      expect(relationships[0].type).toBe(RelationType.ONE_TO_ONE);
    });
  });
});

describe("NormalizationAnalyzer", () => {
  describe("detect3NFViolations", () => {
    it("should detect transitive dependencies", () => {
      const table = createMockTable({
        name: "Order",
        fields: [
          { name: "id", type: "Int", primaryKey: true },
          { name: "customerId", type: "Int" },
          { name: "customerCity", type: "String" }, // Transitive: id → customerId → customerCity
          { name: "total", type: "Decimal" }
        ]
      });
      
      const analyzer = new NormalizationAnalyzer();
      const violations = analyzer.detect3NFViolations(table);
      
      expect(violations).toHaveLength(1);
      expect(violations[0].type).toBe("transitive_dependency");
      expect(violations[0].fields).toContain("customerCity");
    });
  });
});
```

### Integration Tests

```typescript
describe("Full Analysis Pipeline", () => {
  it("should generate complete analysis report from Prisma and DBML files", async () => {
    const currentSchema = await parser.parsePrismaSchema("./test/fixtures/current.prisma");
    const completeSchema = await parser.parseDBMLSchema("./test/fixtures/complete.dbml");
    
    const pipeline = new AnalyzerPipeline();
    const results = await pipeline.runFullAnalysis(currentSchema, completeSchema);
    
    expect(results.schemaComparison).toBeDefined();
    expect(results.relationshipAnalysis).toBeDefined();
    expect(results.migrationPlan).toBeDefined();
    expect(results.migrationPlan.steps.length).toBeGreaterThan(0);
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **Schema Parsing:**
   - Cache parsed schemas to avoid re-parsing
   - Use streaming for large DBML files
   - Parallel parsing of independent sections

2. **Relationship Analysis:**
   - Build adjacency graph for O(1) relationship lookups
   - Use memoization for repeated relationship validations
   - Early termination for orphaned table detection

3. **Migration Planning:**
   - Use topological sort for dependency ordering (O(V + E))
   - Cache complexity estimates
   - Parallelize independent migration steps

4. **Report Generation:**
   - Stream large reports instead of building in memory
   - Generate diagrams on-demand
   - Use template caching

### Complexity Analysis

```typescript
// Time complexity for main operations
interface ComplexityAnalysis {
  operation: string;
  timeComplexity: string;
  spaceComplexity: string;
}

const COMPLEXITIES: ComplexityAnalysis[] = [
  {
    operation: "Schema Parsing",
    timeComplexity: "O(n)", // n = lines in schema file
    spaceComplexity: "O(t)", // t = number of tables
  },
  {
    operation: "Relationship Detection",
    timeComplexity: "O(t * f)", // t = tables, f = avg fields per table
    spaceComplexity: "O(r)", // r = number of relationships
  },
  {
    operation: "Normalization Analysis",
    timeComplexity: "O(t * f²)", // checking all field dependencies
    spaceComplexity: "O(v)", // v = violations found
  },
  {
    operation: "Migration Planning",
    timeComplexity: "O(t + r)", // topological sort
    spaceComplexity: "O(s)", // s = migration steps
  },
  {
    operation: "Report Generation",
    timeComplexity: "O(t + r + s)", // linear in all results
    spaceComplexity: "O(t + r + s)", // full report in memory
  }
];
```

## Configuration

### Analysis Configuration

```typescript
interface AnalysisConfig {
  // Schema sources
  currentSchemaPath: string;
  completeSchemaPath: string;
  
  // Analysis options
  enableRelationshipAnalysis: boolean;
  enableNormalizationAnalysis: boolean;
  enablePerformanceAnalysis: boolean;
  enableSecurityAnalysis: boolean;
  enableGameFeatureAnalysis: boolean;
  
  // Thresholds
  overIndexingThreshold: number; // default: 5 indexes per table
  performanceImpactThreshold: number; // default: 6/10
  normalizationLevel: NormalizationLevel; // default: THIRD_NF
  
  // Report options
  outputFormat: "markdown" | "html" | "pdf" | "json";
  outputPath: string;
  includeCodeExamples: boolean;
  includeDiagrams: boolean;
  includeExecutiveSummary: boolean;
  
  // Migration options
  generateMigrationScripts: boolean;
  generateRollbackScripts: boolean;
  migrationsOutputPath: string;
  
  // Game-specific
  gameFeatures: GameFeatureMapping[];
}

// Default configuration
const DEFAULT_CONFIG: AnalysisConfig = {
  currentSchemaPath: "./prisma/schema.prisma",
  completeSchemaPath: "./docs/complete-schema.dbml",
  enableRelationshipAnalysis: true,
  enableNormalizationAnalysis: true,
  enablePerformanceAnalysis: true,
  enableSecurityAnalysis: true,
  enableGameFeatureAnalysis: true,
  overIndexingThreshold: 5,
  performanceImpactThreshold: 6,
  normalizationLevel: NormalizationLevel.THIRD_NF,
  outputFormat: "markdown",
  outputPath: "./reports/db-review.md",
  includeCodeExamples: true,
  includeDiagrams: true,
  includeExecutiveSummary: true,
  generateMigrationScripts: true,
  generateRollbackScripts: true,
  migrationsOutputPath: "./migrations",
  gameFeatures: GAME_FEATURES
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema Comparison Completeness

*For any* two schemas (current and complete), the comparison SHALL identify all structural differences including missing tables, mismatched fields, and constraint differences, such that the union of identified matches and mismatches equals the complete set of tables in both schemas.

**Validates: Requirements 1.3, 1.4, 1.5**

### Property 2: Relationship Constraint Validation

*For any* relationship identified in a schema, the validation result SHALL correctly verify that one-to-one relationships have UNIQUE constraints, foreign keys have proper indexes, and cascade behaviors are explicitly defined.

**Validates: Requirements 2.2, 2.5, 2.6, 2.8**

### Property 3: Orphaned Table Detection

*For any* schema graph, a table with zero incoming or outgoing relationships SHALL be identified as orphaned.

**Validates: Requirements 2.7**

### Property 4: Missing Many-to-Many Junction Detection

*For any* schema containing two tables with implied many-to-many semantics (based on naming conventions or field patterns), the system SHALL identify the missing junction table if it does not exist.

**Validates: Requirements 2.4**

### Property 5: Third Normal Form Violation Detection

*For any* table definition, if a transitive dependency exists (A → B → C where A is the primary key), the system SHALL identify it as a 3NF violation.

**Validates: Requirements 3.2**

### Property 6: Repeated Pattern Identification

*For any* schema with duplicate field patterns across multiple tables, the system SHALL identify all instances of the repeated pattern.

**Validates: Requirements 3.3**

### Property 7: Array Field Normalization Analysis

*For any* field with array type containing structured data, the system SHALL evaluate whether normalized relations would be more appropriate based on query patterns and cardinality.

**Validates: Requirements 3.4, 6.7**

### Property 8: Cascade Delete Integrity Analysis

*For any* cascade delete configuration, the system SHALL analyze whether data integrity is maintained and flag configurations that could lead to unintended data loss.

**Validates: Requirements 3.5**

### Property 9: Critical Field NOT NULL Analysis

*For any* table with fields representing required business entities (primary keys, foreign keys, required attributes), the system SHALL identify missing NOT NULL constraints.

**Validates: Requirements 3.6**

### Property 10: Default Value Appropriateness

*For any* field with a default value, the system SHALL evaluate whether the default is semantically appropriate for the field's business purpose.

**Validates: Requirements 3.7**

### Property 11: Foreign Key Index Coverage

*For any* schema containing foreign key relationships, the system SHALL identify all foreign key fields lacking indexes.

**Validates: Requirements 4.2**

### Property 12: High Cardinality Index Recommendation

*For any* field with high cardinality characteristics (unique or near-unique values), the system SHALL recommend index creation if not already indexed.

**Validates: Requirements 4.3**

### Property 13: Query Pattern Index Matching

*For any* query pattern with sorting or filtering operations, the system SHALL recommend appropriate indexes (single or composite) to support the pattern.

**Validates: Requirements 4.5**

### Property 14: Over-Indexing Detection

*For any* table with more indexes than the configured threshold, the system SHALL flag it as potentially over-indexed with write performance impact.

**Validates: Requirements 4.7**

### Property 15: Missing Feature Categorization

*For any* set of missing tables identified through gap analysis, the system SHALL categorize them by functional area (auth, gameplay, social, etc.) and criticality level.

**Validates: Requirements 1.7, 5.10**

### Property 16: Primary Key Type Evaluation

*For any* table with a primary key, the system SHALL evaluate whether UUID or integer type is more appropriate based on distribution requirements, lookup patterns, and scalability needs.

**Validates: Requirements 6.1**

### Property 17: VARCHAR Length Constraint Analysis

*For any* varchar field without length constraint, the system SHALL recommend appropriate length based on field semantics and data characteristics.

**Validates: Requirements 6.2**

### Property 18: Numeric Type Storage Optimization

*For any* numeric field, the system SHALL analyze whether the current type (INT, BIGINT, DECIMAL, etc.) is storage-efficient for the expected value range.

**Validates: Requirements 6.3**

### Property 19: JSONB Recommendation for Flexible Data

*For any* field storing semi-structured or variable-schema data, the system SHALL evaluate whether JSONB would be more appropriate than fixed columns.

**Validates: Requirements 6.4**

### Property 20: Timestamp Field Consistency

*For any* schema with timestamp fields (createdAt, updatedAt), the system SHALL verify consistent naming, type, and presence across tables requiring audit trails.

**Validates: Requirements 6.5**

### Property 21: Boolean Default Appropriateness

*For any* boolean field, the system SHALL verify that the default value (if present) aligns with the field's semantic meaning (e.g., isActive defaults to true, isDeleted defaults to false).

**Validates: Requirements 6.6**

### Property 22: Enum Constraint Recommendation

*For any* field with a limited, well-defined value set, the system SHALL recommend enum constraint implementation.

**Validates: Requirements 6.8**

### Property 23: Partitioning Recommendation for Growth

*For any* table with unbounded or exponential growth patterns, the system SHALL recommend partitioning strategies (time-based, range-based, or hash-based).

**Validates: Requirements 7.2**

### Property 24: N+1 Query Problem Detection

*For any* relationship graph where one-to-many relationships lack eager loading strategies or proper indexing, the system SHALL identify potential N+1 query problems.

**Validates: Requirements 7.3**

### Property 25: High-Traffic Bottleneck Identification

*For any* table with high-traffic indicators (frequent reads/writes, large row counts), the system SHALL identify potential bottlenecks and recommend optimizations.

**Validates: Requirements 7.4**

### Property 26: Archival Strategy for Unbounded Growth

*For any* table with unbounded growth (logs, events, analytics), the system SHALL recommend archival strategies with retention policies.

**Validates: Requirements 7.5**

### Property 27: Caching Opportunity for Read-Heavy Tables

*For any* table with read-heavy access patterns (high read:write ratio), the system SHALL recommend caching strategies.

**Validates: Requirements 7.6**

### Property 28: Time-Series Optimization Detection

*For any* table storing time-series data (events, metrics, logs), the system SHALL recommend time-series specific optimizations (partitioning, compression, retention).

**Validates: Requirements 7.8**

### Property 29: Sensitive Field Encryption Requirement

*For any* field containing sensitive data (credentials, PII, financial data), the system SHALL identify encryption requirements.

**Validates: Requirements 8.1**

### Property 30: Delete Pattern Evaluation

*For any* table containing user data or auditable records, the system SHALL evaluate whether soft delete or hard delete is more appropriate and verify implementation.

**Validates: Requirements 8.2**

### Property 31: Audit Trail Completeness

*For any* schema, the system SHALL analyze audit trail completeness by verifying presence of createdAt, updatedAt, and createdBy fields on critical tables.

**Validates: Requirements 8.3**

### Property 32: GDPR Compliance Identification

*For any* field containing user personal data, the system SHALL identify GDPR compliance requirements including right to erasure and data export capabilities.

**Validates: Requirements 8.4**

### Property 33: Row-Level Security Requirements

*For any* multi-tenant table or table with user-scoped data, the system SHALL evaluate row-level security requirements.

**Validates: Requirements 8.5**

### Property 34: Credential Hashing Validation

*For any* field storing user credentials (password, token), the system SHALL validate that proper hashing mechanisms are implemented.

**Validates: Requirements 8.6**

### Property 35: Access Logging Requirements

*For any* table containing sensitive operations or data, the system SHALL identify access logging requirements.

**Validates: Requirements 8.7**

### Property 36: Migration Sequence Dependency Ordering

*For any* set of schema changes between current and target schemas, the migration sequence SHALL respect dependency ordering such that referenced tables are created before referencing tables.

**Validates: Requirements 9.1, 9.7**

### Property 37: Backward Compatibility Detection

*For any* schema change in a migration step, the system SHALL identify whether it maintains backward compatibility with existing application code.

**Validates: Requirements 9.2**

### Property 38: Data Migration Script Generation

*For any* schema change requiring data transformation (column rename, type change, table split), the system SHALL generate appropriate data migration scripts.

**Validates: Requirements 9.3**

### Property 39: Zero-Downtime Feasibility

*For any* migration step, the system SHALL determine whether it can be executed with zero downtime through techniques like dual-write, shadow tables, or online schema change.

**Validates: Requirements 9.4**

### Property 40: Breaking Change Rollback Documentation

*For any* migration step identified as a breaking change, the system SHALL generate complete rollback procedures including SQL and data restoration steps.

**Validates: Requirements 9.5**

### Property 41: Migration Complexity Estimation

*For any* migration step, the system SHALL estimate complexity level based on factors including data volume, table dependencies, and required transformations.

**Validates: Requirements 9.6**

### Property 42: Migration Testing Strategy

*For any* migration step, the system SHALL recommend appropriate testing strategies including validation queries, data integrity checks, and rollback testing.

**Validates: Requirements 9.8**

### Property 43: Multi-Factor Prioritization

*For any* finding or recommendation, the priority score SHALL be calculated as a weighted combination of data integrity impact, security impact, performance impact, feature completeness impact, and implementation complexity.

**Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 44: Related Change Grouping

*For any* set of recommendations, related changes (affecting same table, same feature, or dependent changes) SHALL be grouped into logical implementation phases.

**Validates: Requirements 10.6**

### Property 45: Effort Estimation by Priority

*For any* priority tier (critical, high, medium, low), the system SHALL provide aggregate effort estimates for all recommendations in that tier.

**Validates: Requirements 10.7**

### Property 46: Quick Win vs Long-Term Classification

*For any* recommendation, if it has low implementation complexity and high impact, it SHALL be classified as a quick win; otherwise, it SHALL be classified as a long-term improvement.

**Validates: Requirements 10.8**

### Property 47: MVP Database Recommendation

*For any* complete feature set, the system SHALL recommend a minimal viable database subset that enables core functionality while deferring advanced features.

**Validates: Requirements 10.9**

### Property 48: Prioritization Rationale Completeness

*For any* prioritization decision, the system SHALL provide a rationale explaining the factors considered (impact, complexity, dependencies) and the reasoning for the assigned priority.

**Validates: Requirements 10.10**

### Property 49: Executive Summary Completeness

*For any* analysis result set, the executive summary SHALL include high-level findings, critical issue counts, and recommended next steps.

**Validates: Requirements 11.1**

### Property 50: Detailed Issue Analysis

*For any* identified issue, the detailed analysis SHALL include description, impact assessment, affected components, and specific recommendations.

**Validates: Requirements 11.2**

### Property 51: Relationship Diagram Generation

*For any* schema, the system SHALL generate a visual relationship diagram showing all tables and their connections.

**Validates: Requirements 11.3**

### Property 52: Current vs Recommended State Documentation

*For any* recommendation involving schema changes, the system SHALL document both the current state and the recommended state with clear comparison.

**Validates: Requirements 11.4**

### Property 53: Code Example Generation

*For any* recommendation, the system SHALL provide concrete code examples in the appropriate language (Prisma, SQL, TypeScript) demonstrating the recommended change.

**Validates: Requirements 11.5**

### Property 54: Performance Impact Estimation

*For any* recommendation with performance implications, the system SHALL estimate the performance impact (query time improvement, throughput increase, etc.).

**Validates: Requirements 11.6**

### Property 55: Best Practice Reference Mapping

*For any* identified issue or recommendation, the system SHALL reference relevant industry best practices (database normalization, indexing strategies, security patterns).

**Validates: Requirements 11.7**

### Property 56: Implementation Checklist Generation

*For any* implementation phase or recommendation, the system SHALL generate a step-by-step checklist with dependencies and estimated times.

**Validates: Requirements 11.8**

### Property 57: Risk Assessment for Recommendations

*For any* recommendation, the system SHALL include a risk assessment covering data loss risk, performance risk, and compatibility risk.

**Validates: Requirements 11.9**

### Property 58: Gameplay Feature Database Support

*For any* gameplay feature (classic mode, infinite mode, boss battle, multiplayer, etc.), the system SHALL analyze whether the current schema provides adequate database support and identify missing components.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.10**

### Property 59: Game System Support Analysis

*For any* game system (progression, inventory, leaderboard, achievements, social features), the system SHALL verify that required tables and relationships exist to support the system's functionality.

**Validates: Requirements 12.5, 12.6, 12.7, 12.8, 12.9**

## Conclusion

This design provides a comprehensive architecture for analyzing the Memorize game database, comparing current implementation against complete design, and generating actionable recommendations with prioritized migration plans. The modular component structure allows for independent testing and evolution of each analysis module while maintaining a cohesive end-to-end analysis pipeline.

The correctness properties ensure that all analysis operations maintain mathematical rigor and completeness, providing confidence that the generated recommendations are accurate and comprehensive.
