async function run() {
  const res = await fetch('https://petid-vet-2.vercel.app/api/send-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: '0996504236',
      params: {
        customerName: 'Juan',
        petName: 'Cash',
        businessName: 'VETPS',
        fecha: 'mañana',
        hora: '10:00 AM',
        serviceName: 'Consulta General'
      }
    })
  })
  const text = await res.text()
  console.log('Webhook result:', text)
}
run()
