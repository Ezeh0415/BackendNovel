const user = {
  name: "John",
  email: "john@gmail.com",
  password: "123456789",
};

const Base_Url = "http://localhost:8080";
const userId = "68aff015c7d0934b36cd2ac5";

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
const handlePost = () => {
  const UserName = "chigozie";
  fetch(`${Base_Url}/books/review/count`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      UserName,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

// handlePost();

const handleDelete = () => {
  fetch(`${Base_Url}/books/liked/68a1094ed6c8c0554b56a570`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

// handleDelete();
