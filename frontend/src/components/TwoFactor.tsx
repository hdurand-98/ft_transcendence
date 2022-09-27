import { useState } from "react";
import { useNavigate } from "react-router-dom";

function TwoFactor() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); //redirection

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/2fa/validate", {
        method: "POST",
        body: JSON.stringify({
          token: name,
        }),
        headers: {
            "Content-Type": "application/json",
        },
      });
      // let resJson = await res.json();
      if (res.status === 201) {
        setName("");
        setMessage("2FA created successfully");
        return (navigate("/")); //redirection to home if success
      } else {
        setMessage("Wrong code");

      }
    } catch (err) {
    }
  };

  return (
    <div>
      <div className="twofa-container">
        <h2>2FA AUTHENTICATION</h2>
        <p>You must send your 2fa code.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            placeholder="Send your code"
            onChange={(e) => setName(e.target.value)}
          />
          <div className="message">{message ? <p>{message}</p> : null}</div>
        </form>
      </div>
    </div>
  );
}

export default TwoFactor;
