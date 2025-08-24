const user = {
  name: "John",
  email: "john@gmail.com",
  password: "123456789",
};

const Base_Url = "http://localhost:8080";

const handleSubmit = () => {
  fetch(`${Base_Url}/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: user.name,
      email: user.email,
      password: user.password,
    }),
  })
    .then((response) => response.json())
    .then((data) => console.log(data))
    .catch((error) => console.error(error));
};

// handleSubmit();
