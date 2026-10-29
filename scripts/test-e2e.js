const fs = require('fs');
const path = require('path');

async function runTests() {
  const baseUrl = 'http://localhost:4000';
  console.log('--- Starting Complete End-to-End Test Suite ---');

  // Test Swagger
  console.log('1. Checking Swagger docs at http://localhost:4000/api-docs...');
  const swaggerRes = await fetch(`${baseUrl}/api-docs/`);
  if (!swaggerRes.ok && swaggerRes.status !== 301) {
    throw new Error(`Swagger failed: ${swaggerRes.status}`);
  }
  console.log('✓ Swagger docs reachable (HTTP ' + swaggerRes.status + ')');

  // Register User A
  const ts = Date.now();
  const userAUsername = `test_user_a_${ts}`;
  console.log(`2. Registering User A (${userAUsername})...`);
  const regARes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: userAUsername,
      email: `${userAUsername}@test.com`,
      password: 'password123',
    }),
  });
  const regAData = await regARes.json();
  if (!regARes.ok) throw new Error(`User A registration failed: ${JSON.stringify(regAData)}`);
  console.log('✓ User A registered successfully. Received tokens.');

  // Login User A
  console.log('3. Logging in User A...');
  const loginARes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: userAUsername, password: 'password123' }),
  });
  const loginAData = await loginARes.json();
  if (!loginARes.ok) throw new Error(`User A login failed: ${JSON.stringify(loginAData)}`);
  const tokenA = loginAData.access;
  const refreshA = loginAData.refresh;
  console.log('✓ User A logged in successfully.');

  // Me endpoint
  console.log('4. Testing GET /api/auth/me...');
  const meRes = await fetch(`${baseUrl}/api/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const meData = await meRes.json();
  if (!meRes.ok || meData.username !== userAUsername) {
    throw new Error(`GET /api/auth/me failed: ${JSON.stringify(meData)}`);
  }
  console.log('✓ GET /api/auth/me works correctly: ' + meData.username);

  // Refresh token
  console.log('5. Testing POST /api/auth/refresh...');
  const refRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshA }),
  });
  const refData = await refRes.json();
  if (!refRes.ok || !refData.access) {
    throw new Error(`Refresh token failed: ${JSON.stringify(refData)}`);
  }
  console.log('✓ POST /api/auth/refresh returned new tokens.');

  // Create temporary test image
  const tempImgPath = path.join(__dirname, 'test-img.jpg');
  fs.writeFileSync(tempImgPath, 'FAKE_IMAGE_BYTES_12345');

  // Create Product 1 with multipart/form-data
  console.log('6. Testing POST /api/products with multipart/form-data (File upload)...');
  const formData = new FormData();
  formData.append('name', 'Coca Cola 0.5L');
  formData.append('barcode', 'CH0000034936');
  formData.append('purchase_date', '2026-10-06');
  formData.append('file', new Blob([fs.readFileSync(tempImgPath)], { type: 'image/jpeg' }), 'test-img.jpg');

  const createRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: formData,
  });
  const createData = await createRes.json();
  if (!createRes.ok) throw new Error(`Product create failed: ${JSON.stringify(createData)}`);
  console.log('✓ Product created:', createData.name, 'with barcode:', createData.barcode, 'file:', createData.file);
  const prod1Id = createData.id;

  // Verify file served statically
  if (createData.file) {
    const fileRes = await fetch(`${baseUrl}${createData.file}`);
    if (!fileRes.ok) throw new Error(`Uploaded file not accessible at ${createData.file}`);
    console.log('✓ Uploaded file served correctly at ' + createData.file);
  }

  // Create Product 2 for User A
  console.log('7. Creating Product 2 for User A...');
  const form2 = new FormData();
  form2.append('name', 'Snickers Super');
  form2.append('barcode', '0000123456789');
  form2.append('purchase_date', '2026-10-06');

  const create2Res = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: form2,
  });
  const create2Data = await create2Res.json();
  if (!create2Res.ok) throw new Error(`Product 2 create failed: ${JSON.stringify(create2Data)}`);
  console.log('✓ Product 2 created:', create2Data.name, 'barcode:', create2Data.barcode);

  // Test compound unique constraint for User A
  console.log('8. Testing compound unique barcode constraint for same user...');
  const dupForm = new FormData();
  dupForm.append('name', 'Duplicate Cola');
  dupForm.append('barcode', 'CH0000034936');
  dupForm.append('purchase_date', '2026-10-06');

  const dupRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: dupForm,
  });
  if (dupRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate barcode, got ${dupRes.status}`);
  }
  console.log('✓ Successfully blocked duplicate barcode for same user (409 Conflict).');

  // Test User B can have the SAME barcode
  console.log('9. Testing User B with the SAME barcode (Multi-user uniqueness)...');
  const userBUsername = `test_user_b_${ts}`;
  const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: userBUsername, password: 'password123' }),
  });
  const regBData = await regBRes.json();
  const tokenB = regBData.access;

  const formB = new FormData();
  formB.append('name', 'User B Coca Cola');
  formB.append('barcode', 'CH0000034936'); // Same barcode as User A!
  formB.append('purchase_date', '2026-10-06');

  const createBRes = await fetch(`${baseUrl}/api/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: formB,
  });
  const createBData = await createBRes.json();
  if (!createBRes.ok) {
    throw new Error(`User B should be allowed to use same barcode, but failed: ${JSON.stringify(createBData)}`);
  }
  console.log('✓ User B successfully created product with same barcode (CH0000034936)!');

  // Test User Isolation
  console.log('10. Testing User Isolation...');
  const listARes = await fetch(`${baseUrl}/api/products`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const listAData = await listARes.json();
  const listBRes = await fetch(`${baseUrl}/api/products`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const listBData = await listBRes.json();

  console.log(`User A products count: ${listAData.count}, User B products count: ${listBData.count}`);
  if (listAData.count !== 2 || listBData.count !== 1) {
    throw new Error('User isolation check failed!');
  }
  console.log('✓ User isolation verified: User A sees only 2 products, User B sees only 1.');

  // Test Search by name
  console.log('11. Testing Search by name: ?search=Coca...');
  const searchNameRes = await fetch(`${baseUrl}/api/products?search=Coca`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const searchNameData = await searchNameRes.json();
  if (searchNameData.results.length !== 1 || searchNameData.results[0].name !== 'Coca Cola 0.5L') {
    throw new Error(`Search by name failed: ${JSON.stringify(searchNameData)}`);
  }
  console.log('✓ Search by name works: found ' + searchNameData.results[0].name);

  // Test Search by barcode in ?search=
  console.log('12. Testing Search by barcode via general ?search=CH0000034936...');
  const searchBarcodeRes = await fetch(`${baseUrl}/api/products?search=CH0000034936`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const searchBarcodeData = await searchBarcodeRes.json();
  if (searchBarcodeData.results.length !== 1 || searchBarcodeData.results[0].barcode !== 'CH0000034936') {
    throw new Error(`Search by barcode in ?search failed: ${JSON.stringify(searchBarcodeData)}`);
  }
  console.log('✓ Search by barcode in ?search works: found ' + searchBarcodeData.results[0].barcode);

  // Test Exact Search by barcode: ?barcode=
  console.log('13. Testing Exact Search by barcode: ?barcode=0000123456789...');
  const exactBarcodeRes = await fetch(`${baseUrl}/api/products?barcode=0000123456789`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const exactBarcodeData = await exactBarcodeRes.json();
  if (exactBarcodeData.results.length !== 1 || exactBarcodeData.results[0].name !== 'Snickers Super') {
    throw new Error(`Exact barcode search failed: ${JSON.stringify(exactBarcodeData)}`);
  }
  console.log('✓ Exact barcode search works: found ' + exactBarcodeData.results[0].name);

  // Test Get single product
  console.log('14. Testing GET /api/products/:id...');
  const singleRes = await fetch(`${baseUrl}/api/products/${prod1Id}`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const singleData = await singleRes.json();
  if (!singleRes.ok || singleData.id !== prod1Id) {
    throw new Error(`Get product by id failed: ${JSON.stringify(singleData)}`);
  }
  console.log('✓ GET /api/products/:id works: ' + singleData.name);

  // Test Update product
  console.log('15. Testing PATCH /api/products/:id...');
  const updateRes = await fetch(`${baseUrl}/api/products/${prod1Id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ name: 'Coca Cola 0.5L Updated' }),
  });
  const updateData = await updateRes.json();
  if (!updateRes.ok || updateData.name !== 'Coca Cola 0.5L Updated') {
    throw new Error(`Update product failed: ${JSON.stringify(updateData)}`);
  }
  console.log('✓ PATCH /api/products/:id works: updated name to ' + updateData.name);

  // Test Delete product
  console.log('16. Testing DELETE /api/products/:id...');
  const delRes = await fetch(`${baseUrl}/api/products/${prod1Id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status}`);
  console.log('✓ DELETE /api/products/:id works.');

  // Test Logout
  console.log('17. Testing POST /api/auth/logout...');
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshA }),
  });
  if (!logoutRes.ok) throw new Error(`Logout failed: ${logoutRes.status}`);
  console.log('✓ Logout works.');

  // Test Frontend
  console.log('18. Testing Frontend at http://localhost:3000...');
  const frontRes = await fetch('http://localhost:3000');
  if (!frontRes.ok) throw new Error(`Frontend failed: ${frontRes.status}`);
  console.log('✓ Frontend reachable at http://localhost:3000 (HTTP ' + frontRes.status + ')');

  // Clean up temp file
  if (fs.existsSync(tempImgPath)) fs.unlinkSync(tempImgPath);

  console.log('\n========================================');
  console.log('🎉 ALL 18 VERIFICATION CHECKS PASSED SUCCESSFULLY! 🎉');
  console.log('========================================');
}

runTests().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
