import { useState, useEffect } from "react";
import 'font-awesome/css/font-awesome.min.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCookies } from "react-cookie";
import { socketo } from '../index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCommentDots } from '@fortawesome/free-solid-svg-icons'
import { faRankingStar } from '@fortawesome/free-solid-svg-icons'
import { faUserGear } from '@fortawesome/free-solid-svg-icons'

export const Header = () => {

    const [data, setData] = useState<any>([]);
    const location = useLocation().pathname;
    const [cookies, , removeCookie] = useCookies();
    const [gameInvite, setGameInvite] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        socketo.on('toUpdate', (msg:any) => {
            getData();
        });
        const getData = () => {
            fetch(`/api/user/me`).then((response) => {
                if (response.ok) {
                    return response.json();
                }
                else {
                    removeCookie('Authentication');
                    navigate('/login');
                    throw new Error('not cool man');
                }
            }).then((responseJson) => {
                setData(responseJson);
            }).catch((err) => {
                // const mute = err;
            })
        }
        getData()
    }, [cookies.Authentication, navigate, removeCookie])

    useEffect(
        () => {
          socketo.on('accept invite', (id: string, mode:number) => {
            setGameInvite("Game : new request !");
          });
          socketo.on('newFriendRequest', (msg: any, tab: any) => {
            if (msg === "newfriendrequest")
                setGameInvite("Friend : new request !")
          });
          socketo.on('error', (msg: any) => {
            setGameInvite("Error : " + msg.event);
            });

        }, []);

        function displayNot() {
            setTimeout(() => {
                setGameInvite("");
              }, 8000);
            if (!gameInvite)
                return("");
            else if (gameInvite[0] === 'G')
                return (<div className="notifbg" style={{backgroundColor: 'rgba(240, 147, 43, 0.7)', border: '1px solid rgba(240, 147, 43, 1)'}}><h5>{gameInvite}</h5></div>)
            else if (gameInvite[0] === 'F')
                return (<div className="notifbg" style={{backgroundColor: 'rgba(116, 185, 255, 0.7)', border: '1px solid rgba(116, 185, 255, 1)'}}><h5>{gameInvite}</h5></div>)
            else if (gameInvite[0] === 'E')
                return (<div className="notifbg" style={{backgroundColor: 'rgba(255, 71, 87, 0.7)', border: '1px solid rgba(255, 71, 87, 1)'}}><h5>{gameInvite}</h5></div>)
        }

    return (
            <div className="header">
                <div className="title">
                    <Link to="/" style={{ textDecoration: 'none' }}><img src="bplogo.png" alt="bp logo"></img></Link>
                </div>
                <div className="onglets">
                        <Link className="onglets-community" to="/community" style={{textDecoration: 'none'}}> 
                            <FontAwesomeIcon icon={faCommentDots} style={{color: location==="/community" ? '#1dd1a1' : '#b6b6b6', transition: 'all 0.5s ease-out'}} />
                        </Link>
                        <Link className="onglets-ladder" to="/ladder" style={{textDecoration: 'none'}}> 
                            <FontAwesomeIcon icon={faRankingStar} style={{color: location==="/ladder" ? '#1dd1a1' : '#b6b6b6', transition: 'all 0.5s ease-out'}} />
                        </Link>
                        <Link className="onglets-profile" to="/profile/me" style={{textDecoration: 'none'}}> 
                            <FontAwesomeIcon icon={faUserGear} style={{color: location==="/profile/me" ? '#1dd1a1' : '#b6b6b6', transition: 'all 0.5s ease-out'}} />
                        </Link>
                </div>
                <div className="info">
                    <img src={data.avatar_url} alt="user"></img>
                    <h1 style={{color: '#1dd1a1'}}>{data.name}</h1>
                </div>

                <div className="notifications">
                    {displayNot()}
                </div>
            </div>
    )
}
