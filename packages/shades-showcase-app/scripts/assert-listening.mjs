const fail = (reason) => {
  console.log(`Server is not listening`, reason)
  process.exit(1)
}

fetch('http://127.0.0.1:8080/')
  .then((response) => {
    if (!response.ok) {
      fail({ status: response.status, statusText: response.statusText, response })
    }
  })
  .then(() => {
    console.log('Server is listening')
  })
  .catch(fail)
