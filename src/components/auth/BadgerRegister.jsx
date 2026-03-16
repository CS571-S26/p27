import React, { useContext, useState } from "react";
import { Form, Button } from "react-bootstrap";
import BadgerLoginStatusContext from "../contexts/BadgerLoginStatusContext";
import { useNavigate } from "react-router";


export default function BadgerRegister() {

    // TODO Create the register component.
    const [username, setUsername] = useState("");
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [loginStatus, setLoginStatus] = useContext(BadgerLoginStatusContext);
    const navigate = useNavigate();


    const handleRegister = () => {
        if (!username || username.length === 0 || !pin || pin.length === 0) {
            alert("You must provide both a username and pin!");
            return;
        }

        if (!/^\d{7}$/.test(pin)) {
            alert("Your pin must be a 7-digit number!");
            return;
        }

        if (pin !== confirmPin) {
            alert("Your pins do not match!");
            return;
        }

        // API call
        fetch("https://cs571api.cs.wisc.edu/rest/s26/hw6/register", {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CS571-ID": CS571.getBadgerId(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, pin })
        }).then(res => {
            if (res.status === 409) {
                alert("That username has already been taken!");
                return;
            }
            return res.json();
        }).then(json => {
            if (!json) return;
            setLoginStatus(username);
            sessionStorage.setItem("loginStatus", JSON.stringify(username));
            alert("You have successfully registered!");
            navigate("/");

        });

    };

    return <>
        <h1>Register</h1>
        <Form>
            <Form.Label htmlFor="Username Box">Username</Form.Label>
            <Form.Control
                type="text"
                value={username}
                id="Username Box"
                onChange={e => setUsername(e.target.value)}
            />
            <Form.Label htmlFor="Pin Box">Pin</Form.Label>
            <Form.Control
                type="password"
                value={pin}
                id="Pin Box"
                onChange={e => setPin(e.target.value)}
            />
            <Form.Label htmlFor="Pin Comfirmation Box">Confirm Pin</Form.Label>
            <Form.Control
                type="password"
                value={confirmPin}
                id="Pin Comfirmation Box"
                onChange={e => setConfirmPin(e.target.value)}
            />
            <Button onClick={handleRegister}>Register</Button>
        </Form>
    </>
}
