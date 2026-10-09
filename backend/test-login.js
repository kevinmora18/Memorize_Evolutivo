const API_BASE = 'http://localhost:5175';

async function testLogin() {
  console.log('🧪 Probando Login...\n');

  try {
    const email = 'kevin@test.com';
    
    console.log('📧 Intentando login con:', email);
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Usuario guardado en la base de datos:');
      console.log(JSON.stringify(data, null, 2));
      console.log('\n🎉 ¡Ahora ve a Prisma Studio y refresca la tabla "users"!');
    } else {
      console.log('❌ Error:', response.statusText);
      const error = await response.text();
      console.log('Detalles:', error);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n🔍 Verifica que el backend esté corriendo en http://localhost:5175');
  }
}

testLogin();
