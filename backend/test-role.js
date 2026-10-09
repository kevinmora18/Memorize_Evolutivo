const API_BASE = 'http://localhost:5175';

async function testRole() {
  console.log('🧪 Probando el campo role...\n');

  try {
    const email = 'kevin@test.com'; // Cambia esto por tu email
    
    console.log('📧 Haciendo login con:', email);
    
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Respuesta del backend:');
      console.log('   Email:', data.email);
      console.log('   Role:', data.role);
      console.log('   ID:', data.id);
      
      if (data.role === 'admin') {
        console.log('\n🎉 ¡Eres ADMIN! El botón debería aparecer.');
      } else {
        console.log('\n⚠️  Tu rol es:', data.role);
        console.log('💡 Ve a Prisma Studio y cambia el campo "role" a "admin"');
        console.log('   http://localhost:5555');
      }
    } else {
      console.log('❌ Error:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testRole();
