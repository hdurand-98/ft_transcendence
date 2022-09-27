import { Link } from 'react-router-dom';
import Particles from "react-particles";
import { loadFull } from "tsparticles";
const particlesInit = async (main:any) => {await loadFull(main);};
import { cfg } from "./particles-cfg"

export default function NotFound() {
    return (
        <div>
            <Particles id="tsparticles" init={particlesInit} options={cfg}/>
        <div className="notfound-container">
            <h2>404 ERROR : NOT FOUND</h2>
            <Link to="/" style={{ textDecoration: 'none'}}><button>GO BACK TO HOME</button></Link>
        </div>
        </div>
    );
}
