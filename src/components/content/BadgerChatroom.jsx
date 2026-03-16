import React, { useEffect, useState, useContext, useRef } from "react"
import { Pagination } from "react-bootstrap";
import BadgerMessage from "./BadgerMessage";
import BadgerLoginStatusContext from "../contexts/BadgerLoginStatusContext";
import { Form, Button } from "react-bootstrap";

export default function BadgerChatroom(props) {

    const [messages, setMessages] = useState([]);
    const [page, setPage] = useState(1);

    const loadMessages = (page) => {
        fetch(`https://cs571api.cs.wisc.edu/rest/s26/hw6/messages?chatroom=${props.name}&page=${page}`, {
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        }).then(res => res.json()).then(json => {
            setMessages(json.messages)
            console.log(messages);
        })
    };
    const titleRef = useRef();
    const postRef = useRef();
    const handlePost = () => {
        const title = titleRef.current.value;
        const content = postRef.current.value;

        if (!title || !content) {
            alert("You must provide both a title and content!");
            return;
        }

        fetch(`https://cs571api.cs.wisc.edu/rest/s26/hw6/messages?chatroom=${props.name}`, {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CS571-ID": CS571.getBadgerId(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, content })
        }).then(res => res.json()).then(json => {
            alert("Successfully posted!");
            titleRef.current.value = "";
            postRef.current.value = "";

            loadMessages(page);
        });
    };
    const handleDelete = (id) => {
        fetch(`https://cs571api.cs.wisc.edu/rest/s26/hw6/messages?id=${id}`, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "X-CS571-ID": CS571.getBadgerId()
            }
        }).then(res => res.json()).then(json => {
            alert("Successfully deleted the post!");

            loadMessages(page);
        });
    };

    // Why can't we just say []?
    // The BadgerChatroom doesn't unload/reload when switching
    // chatrooms, only its props change! Try it yourself.
    useEffect(() => { loadMessages(page); }, [props.name, page]);
    const [loginStatus, setLoginStatus] = useContext(BadgerLoginStatusContext);


    return <>
        <h1>{props.name} Chatroom</h1>
        {
            /* TODO: Allow an authenticated user to create a post. */
        }
        {loginStatus ?
            <Form>
                <Form.Label htmlFor="Post Title">Post Title</Form.Label>
                <Form.Control
                    type="text"
                    ref={titleRef}
                    id="Post Title"
                />
                <Form.Label htmlFor="Post Content">Post Content</Form.Label>
                <Form.Control
                    type="text"
                    ref={postRef}
                    id="Post Content"
                />
                <Button onClick={handlePost}>Create Post</Button>
            </Form> :
            <p>You must be logged in to post!</p>}
        <hr />
        {
            messages && messages.length > 0 ?
                <>

                    <div className="row">{
                        messages.map(singlemessage => (
                            <div key={singlemessage.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                                <BadgerMessage loginStatus={loginStatus}
                                    onDelete={handleDelete}  {...singlemessage} />
                            </div>
                        ))


                    }</div>
                </>
                :
                <>
                    <p>There are no messages on this page yet!</p>
                </>
        }
        <Pagination>
            <Pagination.Item active={page === 1} onClick={() => setPage(1)}>1</Pagination.Item>
            <Pagination.Item active={page === 2} onClick={() => setPage(2)}>2</Pagination.Item>
            <Pagination.Item active={page === 3} onClick={() => setPage(3)}>3</Pagination.Item>
            <Pagination.Item active={page === 4} onClick={() => setPage(4)}>4</Pagination.Item>
        </Pagination>
    </>
}
