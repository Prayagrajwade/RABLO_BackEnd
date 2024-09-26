import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
    const token = req.header("Authorization")?.split(" ")[1]; // Extract the token

    console.log("Received Token:", token); // Log the received token

    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        req.user = decoded.user; // Attach user info to request
        next(); // Proceed to the next middleware
    } catch (err) {
        console.error("Token verification error:", err); // Log any errors during verification
        res.status(401).json({ msg: "Token is not valid" });
    }
};

export default auth;