const user = {
  name: "John",
  email: "john@gmail.com",
  password: "123456789",
};

const Base_Url = "http://localhost:8080";
const userId = "68aba7e44ed014ee43d3387a";

const handleSubmit = () => {
  fetch(`${Base_Url}/novelLiked/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

// handleSubmit();
