import { useState, useEffect } from 'react';
import {socketo} from '../index';
import { useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

import Particles from "react-particles";
import { loadFull } from "tsparticles";
const particlesInit = async (main:any) => {await loadFull(main);};
import { cfg } from "./particles-cfg"

export default function Home() {

    const [socket, setSocket] = useState<any>([]);
    const [users, setUsers] = useState<any>([]);
    const [friends, setFriends] = useState<any>([]);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const socket = socketo;
        setSocket(socket);
        socket.emit('getUsers');
        socket.emit('getFriends');
        socket.on('listUsers', (tab:any) => {
            setUsers(tab);
          });
        socket.on('friendList', (msg:any, tab:any) => {
            setFriends(tab);
        });

        socketo.on('enter_room', () => {
            if (location.pathname != "/game")
              navigate('/game');
          })
      }, []);

    const [next, setNext] = useState(0);
    const [mode, setMode] = useState(0);

    useEffect(() => {
        setNext(0);
        setMode(0);
    }, [location]);

    function handleSingleMode() {
        setMode(1);
        setNext(2);
    }

    function handleDoubleMode() {
        setMode(2);
        setNext(2);
    }

    function displayFriends(mode: number) {
        const indents:any = [];
        let j = 0;
        let i = 0;
        let online_friends = 0;
        while (j < users?.length)
        {
            i = 0;
            while (i < friends?.friends?.length)
            {
                if (friends?.friends[i].id === users[j].id)
                    if (users[j].status === 'online')
                    {
                        online_friends = 1;
                        indents.push(
                            <div className='home-search-single-friend' key={i}>
                                <img src={friends?.friends[i].avatar_url} alt="avatar"></img>
                                <h5>{friends?.friends[i].name}</h5>
                                <button id={friends?.friends[i].id} onClick={sendingInvite}>PLAY</button>
                                </div>
                        );
                    }
                i++;
            }
            j++;
        }
        if (!online_friends)
        {
            indents.push(
                <div className='home-search-single-friend' key={i}>
                    <h5>NO ONLINE FRIENDS</h5>
                </div>
            );
        }
        return indents;

    }
    const sendingInvite = (e:any) =>
    {
        socket.emit(('pending invite'), {friendId: e.currentTarget.id, mode: mode})
        //navigate('/game');
    }
    function handleLaunchMatchMaking(mode: number) {
        if (mode === 1)
        {
            socket.emit('game_inQueue', mode);
            navigate('/game');
        }
        else if (mode === 2)
        {
            socket.emit('game_inQueue', mode);
            navigate('/game');
        }
    }

    function displaySteps() {
        if (!next)
        {
            return (
                <div className='home-button'>
                    <button onClick={() => setNext(1)}>START TO PLAY</button>
                </div>
            );
        }
        else if (next === 1)
        {
            return (
                <div className='home-mode'>
                    <div className='home-mode-button-single'><button onClick={handleSingleMode}>NORMAL MODE</button></div>
                    <div className='home-mode-button-double'><button onClick={handleDoubleMode}>SPECIAL MODE</button></div>
                </div>
            );
        }
        else if (next === 2)
        {
            return (
                <div className='home-search'>
                    <div className='home-play-matchmaking'><button onClick={() => handleLaunchMatchMaking(mode)}>MATCHMAKING</button></div>
                    <div className='home-play-friends'>
                        {displayFriends(mode)}
                    </div>
                </div>
            );
        }
    }

    return (
        <div>
            <Particles id="tsparticles" init={particlesInit} options={cfg}/>
        <div className="home-container">
            {displaySteps()}
        </div>
        </div>
    );
}
