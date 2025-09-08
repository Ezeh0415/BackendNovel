const user = {
  name: "John",
  email: "john@gmail.com",
  password: "123456789",
};

const Base_Url = "http://localhost:8080";
const userId = "68aff015c7d0934b36cd2ac5";

const handleSubmit = () => {
  fetch(`${Base_Url}/books?page=2`)
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
  const firstName = "Ezeanwe";
  const lastName = "Chigozie";
  const password = "chigozie3942";
  const email = "ezeanwechigozie@gmail.com";
  const otp = "252813";
  // const userImage = "https://picsum.photos/200/300";
  fetch(`${Base_Url}/user/otpSend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // firstName,
      // lastName,
      // password,
      email,
      otp,
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
