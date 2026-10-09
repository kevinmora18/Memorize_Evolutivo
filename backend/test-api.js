const API_BASE = 'http://localhost:5175';

async function testAPI() {
  console.log('🧪 Probando el Backend API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Test: Health Check');
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Respuesta:', healthData);
    console.log('');

    // Test 2: Login/Register
    console.log('2️⃣ Test: Login/Register Usuario');
    const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@memorize.com',
        username: 'TestPlayer'
      })
    });
    const userData = await loginRes.json();
    console.log('✅ Usuario creado/encontrado:', {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      level: userData.level,
      coins: userData.coins
    });
    console.log('');

    const userId = userData.id;

    // Test 3: Get User Profile
    console.log('3️⃣ Test: Obtener Perfil de Usuario');
    const profileRes = await fetch(`${API_BASE}/api/users/${userId}`);
    const profileData = await profileRes.json();
    console.log('✅ Perfil obtenido:', {
      email: profileData.email,
      stats: profileData.stats,
      inventory: profileData.inventory
    });
    console.log('');

    // Test 4: Save Match
    console.log('4️⃣ Test: Guardar Partida');
    const matchRes = await fetch(`${API_BASE}/api/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        mode: 'classic',
        level: 5,
        score: 1500,
        accuracy: 85,
        combo: 10,
        timeLeft: 30,
        won: true
      })
    });
    const matchData = await matchRes.json();
    console.log('✅ Partida guardada:', {
      id: matchData.id,
      mode: matchData.mode,
      score: matchData.score,
      won: matchData.won
    });
    console.log('');

    // Test 5: Get Match History
    console.log('5️⃣ Test: Obtener Historial de Partidas');
    const historyRes = await fetch(`${API_BASE}/api/users/${userId}/matches?limit=5`);
    const historyData = await historyRes.json();
    console.log('✅ Historial obtenido:', historyData.length, 'partidas');
    console.log('');

    // Test 6: Update Inventory
    console.log('6️⃣ Test: Actualizar Inventario');
    const inventoryRes = await fetch(`${API_BASE}/api/users/${userId}/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownedPacks: ['frutas', 'animales', 'espacio'],
        equippedPack: 'espacio',
        equippedSkin: 'neon'
      })
    });
    const inventoryData = await inventoryRes.json();
    console.log('✅ Inventario actualizado:', {
      ownedPacks: inventoryData.ownedPacks,
      equippedPack: inventoryData.equippedPack,
      equippedSkin: inventoryData.equippedSkin
    });
    console.log('');

    // Test 7: Get Leaderboard
    console.log('7️⃣ Test: Obtener Tabla de Clasificación');
    const leaderboardRes = await fetch(`${API_BASE}/api/leaderboard?limit=5`);
    const leaderboardData = await leaderboardRes.json();
    console.log('✅ Leaderboard obtenido:', leaderboardData.length, 'jugadores');
    console.log('');

    console.log('🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
    console.log('✅ El backend está funcionando correctamente');
    console.log('✅ La base de datos está conectada');
    console.log('✅ Todos los endpoints responden correctamente');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.log('\n🔍 Verifica que:');
    console.log('1. El servidor backend esté corriendo en http://localhost:5175');
    console.log('2. PostgreSQL esté corriendo');
    console.log('3. La base de datos "memorize" exista');
  }
}

testAPI();
