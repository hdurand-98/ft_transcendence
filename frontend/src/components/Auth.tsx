import Particles from "react-particles";
import { loadFull } from "tsparticles";
const particlesInit = async (main:any) => {await loadFull(main);};
import { cfg } from "./particles-cfg"

export default function Auth() {
    return (
        <div>
          {/* COMMENT THIS LINE IN INTERACTIVITY "detect_on": "canvas", */}
          <Particles id="tsparticles" init={particlesInit} options={cfg}/>
            <div className="auth-link">
                <h2>42 AUTHENTICATION</h2>
                <p>You must log in with your 42 account.</p>
                <a href='/api/auth/42/login'><img src="42logo.png" alt="logo 42"></img>LOGIN</a>
            </div>
        </div>
    );
}
