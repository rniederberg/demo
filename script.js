fetch('mock.json')
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok')
    return response.json()
  })
  .then(data => {
        console.log(data)
  })
  .catch(error => {
    console.error('Failed to load JSON:', error)
  })
