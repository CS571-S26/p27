import React, { useContext, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router";
import BadgerLoginStatusContext from "../contexts/BadgerLoginStatusContext";

export default function BadgerLogin() {

    // TODO Create the login component.

    const userRef = useRef();
    const pinRef = useRef();
    const [loginStatus, setLoginStatus] = useContext(BadgerLoginStatusContext);
    const navigate = useNavigate();
     
    
        const handleLogin = () => {
            const username = userRef.current.value;
            const pin = pinRef.current.value;
            if (!username || username.length == 0 || !pin || pin.length == 0) {
                alert("You must provide both a username and pin!");
                return;
            }
            if (!/^\d{7}$/.test(pin)) {
                alert("Your pin is not a 7-digit number!");
                return;
            }
            // API call
            fetch("https://cs571api.cs.wisc.edu/rest/s26/hw6/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CS571-ID": CS571.getBadgerId(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, pin })
            }).then(res => res.json()).then(json => {
                if (json.msg === "That username or pin is incorrect!") {
                    alert("Incorrect username or pin!");
                } else {
                    setLoginStatus(username);
                    sessionStorage.setItem("loginStatus", JSON.stringify(username));
                    alert("You have been successfully logged in!");
                    navigate("/");
                }
            });
        };
    
        return <>
            <h1>Login</h1>
            <Form>
                <Form.Label htmlFor="username box">Username</Form.Label>
                <Form.Control
                    type="text"
                    ref={userRef}
                    id="username box"
                />
                <Form.Label htmlFor="pin box">Pin</Form.Label>
                <Form.Control
                    type="password"
                    ref={pinRef}
                    id="pin box"
                />
                <Button onClick={handleLogin}>Login</Button>
            </Form>
        </>
}
