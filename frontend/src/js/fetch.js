import axios from "axios";

export const fetchUserDetails = async (role, email) => {
  try {
    let url = "";

    switch (role) {
      case "student":
        url = `http://localhost:4000/student/${email}`;
        break;
      case "admin":
        url = `http://localhost:4000/admin/${email}`;
        break;
      case "issuer":
        url = `http://localhost:4000/issuer/${email}`;
        break;
      default:
        throw new Error("Invalid role provided");
    }

    const res = await axios.get(url);

    if (role === "admin") {
      return res.data; 
    } else {
      return res.data.user; 
    }
  } catch (err) {
    
    if (err.response) {
      
      throw {
        status: err.response.status,
        message: err.response.data?.message || err.message,
      };
    } else {
      
      throw {
        status: null,
        message: err.message || "Network error",
      };
    }
  }
};
