import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { faTrophy } from '@fortawesome/free-solid-svg-icons'
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';

import Particles from "react-particles";
import { loadFull } from "tsparticles";
const particlesInit = async (main:any) => {await loadFull(main);};
import { cfg } from "./particles-cfg"

export default function PublicProfile() {

    const [data, setData] = useState<any>([]);
    const [achievements, setAchievements] = useState<any>([]);
    const [history, setHistory] = useState<any>([]);

    const { uuid } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const getData = async () => {
            const response = await fetch(
                `/api/user/` + uuid
            );
            const actualData = await response.json();
            if (response.ok)
                setData(actualData);
            else
                navigate('*');
        }
        const getAchiev = async () => {
            const response = await fetch(
                `/api/achievements/` + uuid
            );
            const actualData = await response.json();
            if (response.ok)
                setAchievements(actualData);
            else
                navigate('*');
        }
        const getHistory = async () => {
            const response = await fetch(
                `/api/game/` + uuid
            );
            const actualData = await response.json();
            if (response.ok)
                setHistory(actualData);
            else
                navigate('*');
        }

        getData()
        getAchiev()
        getHistory()
    }, [])

    function displayHistory() {
        const indents : any = [];
        let i = 0;
        let bgColor = '#ff7675';
        let VorD = "DEFEAT";

        while (i < history?.length)
        {
            if (history[i]?.user1.name === data.name)
            {
                if (history[i]?.scoreUser1 > history[i]?.scoreUser2)
                {
                    VorD = "VICTORY"
                    bgColor = '#74b9ff';
                }
                indents.push(
                    <div style={{backgroundColor: bgColor}} className='history-line' key={i}>
                        <div className="result">{VorD}</div>
                        <div className="myavatar"><img src={data.avatar_url} alt="avatar"></img></div>
                        <div className="myname">{data.name}</div>
                        <div className="score">{history[i]?.scoreUser1} - {history[i]?.scoreUser2}</div>
                        <div className="oppname">{history[i]?.user2.name}</div>
                        <div className="oppavatar"><img src={history[i]?.user2.avatar_url} alt="avatar"></img></div>
                    </div>);
            }
            else
            {
                if (history[i]?.scoreUser2 > history[i]?.scoreUser1)
                {
                    VorD = "VICTORY"
                    bgColor = '#74b9ff';
                }
                indents.push(
                    <div style={{backgroundColor: bgColor}} className='history-line' key={i}>
                        <div className="result">{VorD}</div>
                        <div className="myavatar"><img src={data.avatar_url} alt="avatar"></img></div>
                        <div className="myname">{data.name}</div>
                        <div className="score">{history[i]?.scoreUser2} - {history[i]?.scoreUser1}</div>
                        <div className="oppname">{history[i]?.user1.name}</div>
                        <div className="oppavatar"><img src={history[i]?.user1.avatar_url} alt="avatar"></img></div>
                    </div>);
            }
            i++;
            VorD = "DEFEAT";
            bgColor = '#ff7675';
        }
        return (indents);
    }

    function displayAchievements() {
        const indents : any = [];
        let i = 0;
        const bgColor = '#1dd1a1';

        while (i < achievements?.length)
        {
            indents.push(
                <div style={{backgroundColor: bgColor}} className='achievements-line' key={i}>
                    <FontAwesomeIcon icon={faTrophy} className="trophy"/>
                    <div className="name">{achievements[i]?.achievement_list}</div>
                </div>
            );
            i++;
        }
        return (indents);
    }

    return (
        <div>
            <Particles id="tsparticles" init={particlesInit} options={cfg}/>
        <div className="profile-container">
            <div className="profile-public">
                <FontAwesomeIcon icon={faEye} className="eye" />
                <p>PUBLIC</p>
            </div>

            <div className="profile-img">
                <img src={data.avatar_url} alt="avatar"></img>
            </div>


            <div className="profile-other">
                <div><h5>FULL NAME</h5><p>{data.fullname}</p></div>
                <div><h5>MAIL</h5><p>{data.mail}</p></div>
                <div><h5>VICTORIES</h5><p>{data.wonMatches}</p></div>
            </div>

            <div className="profile-name">
                <h4>PSEUDO : <span>{data.name}</span></h4>
            </div>

            <div className="profile-achievements">
                <h4>ACHIEVEMENTS</h4>
                {displayAchievements()}
            </div>

            <div className="profile-history">
                <h4>MATCH HISTORY</h4>
                {displayHistory()}
            </div>

        </div>
        </div>
    )

}
