fetch('http://localhost:8080').then((response) => {
  if (response.ok) {
    console.log('Server is listening')
    process.exit(0)
  } else {
    console.log(`Server is not listening, status is ${response.status}`)
    process.exit(1)
  }
})
