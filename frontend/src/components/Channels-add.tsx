// REACT TOOLS IMPORT
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from "react-router-dom";

// FONT AWESOME SINGLE IMPORT
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons'
import { faArrowAltCircleRight } from '@fortawesome/free-regular-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { faMask } from '@fortawesome/free-solid-svg-icons'
import { faUserPlus } from '@fortawesome/free-solid-svg-icons'
import { faUserXmark } from '@fortawesome/free-solid-svg-icons'
import { faUserSlash } from '@fortawesome/free-solid-svg-icons'
import { faGamepad } from '@fortawesome/free-solid-svg-icons'
import { faHandsHoldingCircle } from '@fortawesome/free-solid-svg-icons'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import { faCommentSlash } from '@fortawesome/free-solid-svg-icons'
import { faEye } from '@fortawesome/free-solid-svg-icons'
import { faRobot } from '@fortawesome/free-solid-svg-icons'

// SOCKET IMPORT FROM THE INDEX.TSX
import { socketo } from '../index';
import { useCookies } from 'react-cookie';
import { dataGR } from '../index';

// VARIABLE DECLARATIONS OUTSIDE THE CHANNELS FUNCTION
let tmp: any[any];
let indents: any = [];
let ispriv = 2;

import Particles from "react-particles";
import { loadFull } from "tsparticles";
const particlesInit = async (main:any) => {await loadFull(main);};
import { cfg } from "./particles-cfg"

import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional

export default function Channels() {


  // TO DETECT ROUTE CHANGE
  const location = useLocation();
  const navigate = useNavigate();
  const [, , removeCookie] = useCookies();

  // VARIABLE DECLARATIONS
  const [socket, setSocket] = useState<any>([]);
  const [data, setData] = useState<any>([]);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [datame, setDatame] = useState<any>([]);
  const [datausers, setDatausers] = useState<any>([]);
  let BgColor = 'rgba(29, 209, 161, 0.1)';


  // TEST FOR CHAT
  const [chanName, setChanName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any>([]);
  const [messagesPriv, setMessagesPriv] = useState<any>([]);
  const [DisplayChat, setDisplayChat] = useState(0);
  const [privMsgChat, setprivMsgChat] = useState(0);
  const [privTarget, setPrivTarget] = useState<any>([]);

  // DISPLAY FRIENDS LIST
  const [switching, setSwitching] = useState(0);
  const [friends, setFriends] = useState<any>([]);
  const [friendsrequest, setFriendsRequest] = useState<any>([]);
  const [UsersBtnColor, setUsersBtnColor] = useState('rgba(29, 209, 161, 0.5)');
  const [FriendsBtnColor, setFriendsBtnColor] = useState('rgba(116, 185, 255, 0.3)');
  const [RequestsBtnColor, setRequestsBtnColor] = useState('rgba(240, 147, 43, 0.3)');
  
  // CHANNEL CREATION
  const [publicChan, setPublicChan] = useState(3);
  const [passToJoin, setPassToJoin] = useState("");
  const [chanToJoin, setChanToJoin] = useState("");

  // CHANOP
  const [chanOpPass, setChanOpPass] = useState("");

  // GAME
  const [activesmatches, setActivesMatches] = useState<any>([]);
  let [rFlag, setRflag] = useState(0);

  // IF THE ROUTE CHANGE
  useEffect(() => {
    setDisplayChat(0);
    setPublicChan(3);
  }, [location]);

  // FETCH DATA FROM THE USER
  useEffect(() => {
    const getData = async () => {
      const response = await fetch(
        `/api/user/me`
      );
      if (!response.ok) {
        removeCookie('Authentication');
        navigate('/login');
      }
      const actualData = await response.json();
      setDatame(actualData);

    }
    getData()
  }, [navigate, removeCookie])

  // REACT HOOK TO SET UP SOCKET CONNECTION AND LISTENING
  useEffect(
    () => {
      const socket = socketo;
      setSocket(socket);
      socket.emit('getRooms');
      socket.emit('getUsers');
      socket.emit('getFriends');
      socket.emit('getFriendRequests');
      socket.emit('ActivesMatches');
      socket.on('ActivesMatches', (tab: any) => {
        setActivesMatches(tab);
      });
      socket.on('rooms', (msg: any, tab: any) => {
        setData(tab);
      });
      socket.on('listUsers', (tab: any) => {
        setDatausers(tab);
      });
      socket.on('channelMessage', (msg: any) => {
        setMessages(msg);
      });
      socket.on('friendList', (msg: any, tab: any) => {
        setFriends(tab);
      });
      socket.on('newFriendRequest', (msg: any, tab: any) => {
        setFriendsRequest(tab);
      });
      socket.on('privateMessage', (msg: any, tab: any) => {
        setPrivTarget(msg.split(' '));
        setMessagesPriv(tab);
      });
      // socket.on('error', (msg: any) => {
			//   alert(msg.event);
      // });
      socketo.on('accept invite', (id: string, mode:number) => {
        setRflag(rFlag => rFlag + 1);
      });

      socketo.on('enter_room', () => {
        if (location.pathname != "/game")
          navigate('/game');
      })

    }, []);

  useEffect(() => {
    let z = 0;
    let flag = 0;
    while (z < data?.length)
    {
      let w = 0;
      while (w < data[z]?.bannedId?.length)
      {
        if (datame?.id === data[z]?.bannedId[w])
          if (chanName === data[z]?.name)
            setDisplayChat(0);
        w++;
      }
      z++;
    }
    z = 0;
    while (z < data?.length)
    {
      if (chanName === data[z]?.name && !ispriv)
        flag = 1;
      z++;
    }
    if (!flag && !ispriv)
      setDisplayChat(0);
  }, [data, chanName, datame?.id]);


  // FUNCTIONS TO HANDLE ACTIONS ON CHANNELS
  const handleCreate = (e: any) => {
    e.preventDefault();
    if (publicChan === 1) {
      if (!password)
        socket.emit('createRoom', { chanName: name });
      else if (password)
        socket.emit('createRoom', { chanName: name, password: password });
    }
    else if (!publicChan)
      socket.emit('createRoom', { chanName: name, private: true });
    setName("");
    setPassword("");
    setPublicChan(3);
  }
  const handleJoin = (e: any) => {
    let i = 0;

    while (i < data?.length) {
      if (data[i]?.name === e.currentTarget.id) {
        if (data[i]?.password_protected === true)
          setChanToJoin(e.currentTarget.id);
        else
          socket.emit('joinRoom', { chanName: e.currentTarget.id });
      }
      i++;
    }
  }
  const handleJoinProtected = (e: any) => {
    e.preventDefault();
    socket.emit('joinRoom', { chanName: chanToJoin, password: passToJoin });
    setChanToJoin("");
    setPassToJoin("");
  }
  const handleDelete = (e: any) => {
    socket.emit('deleteRoom', e.currentTarget.id);
  }
  const handleLeave = (e: any) => {
    socket.emit('leaveRoom', e.currentTarget.id);
    if (chanName === e.currentTarget.id)
      setDisplayChat(0);
  }
  const handleOpen = (e: any) => {
    if (isInChan(e.currentTarget.id) === 0)
      return (0);
    socket.emit('getChannelMessages', e.currentTarget.id);
    setDisplayChat(1);
    setChanName(e.currentTarget.id);
    setprivMsgChat(0);
  }
  const handleAddFriend = (e: any) => {
    socket.emit('addFriend', datausers[parseInt(e.currentTarget.id)]);
  }
  const handleAcceptFriend = (e: any) => {
    let i = 0;
    while (i < datausers?.length) {
      if (datausers[i]?.id === friendsrequest[parseInt(e.currentTarget.id)].sender.id)
        socket.emit('acceptFriend', datausers[i]);
      i++;
    }
  }
  const handleRemoveFriend = (e: any) => {
    let i = 0;
    while (i < datausers?.length) {
      if (datausers[i]?.id === friends.friends[parseInt(e.currentTarget.id)]?.id)
        socket.emit('removeFriend', datausers[i]);
      i++;
    }
  }
  const handleBlockFriend = (e:any) => {
    socket.emit('block', friends.friends[parseInt(e.currentTarget.id)]);
  }
  const handleUnBlockFriend = (e:any) => {
    socket.emit('unblock', friends.friends[parseInt(e.currentTarget.id)]);
  }
  const handleOpenPrivate = (e:any) => {
    let j = 0;
    while (j < datausers?.length) {
      if (e.currentTarget.id === datausers[j]?.name)
        socket.emit('getPrivateMessage', datausers[j]);
      j++;
    }
    setDisplayChat(1);
    setChanName(e.currentTarget.id);
    setprivMsgChat(1);
  }
  const handleAcceptGame = (e:any) => {
    let sp = 0;
    if (isWatchable(dataGR[parseInt(e.currentTarget.id)].id))
      sp = 1;
    socket.emit('joinGame', {friendId: dataGR[parseInt(e.currentTarget.id)].id, mode: dataGR[parseInt(e.currentTarget.id)].mode});
    if (!sp)
      dataGR.splice(parseInt(e.currentTarget.id), 1);
    //navigate('/game');
  }
  const handleSendInvite = (e:any) =>
  {
      socket.emit(('pending invite'), {friendId: e.currentTarget.id, mode: 1})
      // navigate('/game');
  }


  function ChanStatus(i: number) {
    if (data[i]?.private === false) {
      if (data[i]?.password_protected === true)
        return (<FontAwesomeIcon icon={faLock} className="lock" />)
    }
    else if (data[i]?.private === true)
      return (<FontAwesomeIcon icon={faMask} className="mask" />)
  }

  function PopUp_PassToJoin(i: number) {
    if (chanToJoin && chanToJoin === data[i]?.name) {
      return (
        <div className='channels-single-popuptojoin'>
          <form onSubmit={handleJoinProtected}>
            <input
              type="text"
              value={passToJoin}
              placeholder="Password"
              onChange={(e) => setPassToJoin(e.target.value)}
            />
          </form>
        </div>
      )
    }
  }

  // DISPLAY CHANNELS
  function display_chan() {
    const indents = [];
    let i = 0;

    while (i < data?.length) {
      // set color to green if the main user is in the channel
      let j = 0;
      while (j < data[i]?.users.length) {
        if (datame.name === data[i].users[j]?.name) { BgColor = 'rgba(29, 209, 161, 0.4)'; }
        j++;
      }

      // push every chan div in the array "indents"
      indents.push(
        <div className="channels-single" key={i}>
          {/* <div style={{ 'backgroundColor': BgColor }} className='channels-single-actions'> */}
          <div className='channels-single-actions'>
            <Tippy content="Delete" theme="custom" arrow=""><FontAwesomeIcon icon={faTrashCan} className="trashcan" id={data[i]?.name} onClick={handleDelete} /></Tippy>
            <Tippy content="Leave" theme="custom" arrow=""><FontAwesomeIcon icon={faCircleXmark} className="circlexmark" id={data[i]?.name} onClick={handleLeave} /></Tippy>
            <Tippy content="Join" theme="custom" arrow=""><FontAwesomeIcon icon={faArrowAltCircleRight} className="arrow" id={data[i]?.name} onClick={handleJoin} /></Tippy>
            {PopUp_PassToJoin(i)}
          </div>
          <div style={{ 'backgroundColor': BgColor }} className='channels-single-clickable' id={data[i]?.name} onClick={handleOpen}>
            <h5>{data[i]?.name}</h5>
            {ChanStatus(i)}
          </div>
        </div>
      );
      i++;
      BgColor = 'rgba(29, 209, 161, 0.1)';
    }
    return indents;
  }

  function isWatchable(id:string) {
    let i = 0;
    while (i < activesmatches?.length)
    {
      if (id === activesmatches[i]?.user1 || id === activesmatches[i]?.user2)
        return (1);
      i++;
    }
    return (0);
  }

  const handleWatchMode = (e: any) => {
    let i = 0;
    while (i < activesmatches?.length)
    {
      if (e.currentTarget.id === activesmatches[i]?.user1 || e.currentTarget.id === activesmatches[i]?.user2)
      {
        socket.emit('WatchGame', activesmatches[i]?.id);
        navigate("/game");
      }
      i++;
    }
  }

  function isBlocked(id:string) {
    let i = 0;
    while (i < friends?.blocked?.length)
    {
      if (id === friends?.blocked[i])
        return (1);
      i++;
    }
    return (0);
  }

  function displayButtonFriend(i: number) {
    let j = 0;
    while (j < friends?.friends?.length) {
      if (datausers[i]?.id === friends?.friends[j]?.id) {
        return (<div className='users-single-info-friends'>
                  <Tippy content="Private message" theme="custom" arrow=""><FontAwesomeIcon className='paperplane' icon={faPaperPlane} id={datausers[i]?.name} onClick={handleOpenPrivate} ></FontAwesomeIcon></Tippy>
                  {datausers[i]?.status === 'online' && <Tippy content="Invite to game" theme="custom" arrow=""><FontAwesomeIcon className='gamepad' icon={faGamepad} id={datausers[i]?.id} onClick={handleSendInvite}></FontAwesomeIcon></Tippy>}
                  {isBlocked(datausers[i]?.id) === 0 && <Tippy content="Block" theme="custom" arrow=""><FontAwesomeIcon style={{color: '#1dd1a1'}} className='userslash' icon={faUserSlash} id={j.toString()} onClick={handleBlockFriend}></FontAwesomeIcon></Tippy>}
                  {isBlocked(datausers[i]?.id) === 1 && <Tippy content="Unblock" theme="custom" arrow=""><FontAwesomeIcon style={{color: 'red'}} className='userslash' icon={faUserSlash} id={j.toString()} onClick={handleUnBlockFriend}></FontAwesomeIcon></Tippy>}
                  <Tippy content="Remove friend" theme="custom" arrow=""><FontAwesomeIcon className='userxmark' icon={faUserXmark} id={j.toString()} onClick={handleRemoveFriend} ></FontAwesomeIcon></Tippy>
                  {isWatchable(datausers[i]?.id) === 1 && <Tippy content="Watch game" theme="custom" arrow=""><FontAwesomeIcon id={datausers[i]?.id} className='gameye' icon={faEye} onClick={handleWatchMode}></FontAwesomeIcon></Tippy>}
                </div>
        );
      }
      j++;
    }
    return (
      <Tippy content="Add as friend" theme="custom" arrow=""><FontAwesomeIcon className='userplus' icon={faUserPlus} id={i.toString()} onClick={handleAddFriend} ></FontAwesomeIcon></Tippy>
    )
  }

  // DISPLAY USERS
  function display_users() {
    const indents = [];
    let i = 0;
    let borderStatus = 'white';
    let profilelink;

    if (switching === 0) {
      while (i < datausers?.length) {
        profilelink = "/profile/" + datausers[i]?.id;
        if (isWatchable(datausers[i]?.id))
          borderStatus = "orange";
        else if (datausers[i]?.status === 'online')
          borderStatus = '#1dd1a1';
        else if (datausers[i]?.status === 'offline')
          borderStatus = 'red';

        if (datausers[i]?.name !== "chatBot")
          indents.push(
          <div className="users-single" key={i}>
            <div className='users-single-img'>
              <Link to={profilelink}><img style={{ 'borderColor': borderStatus }} src={datausers[i]?.avatar_url} alt="users"></img></Link>
            </div>
            <div className='users-single-info'>
              <h5>{datausers[i]?.name}</h5>
              {displayButtonFriend(i)}
            </div>
          </div>);
          i++;
          borderStatus = 'white';
      }
    }
    if (switching === 1) {
      while (i < datausers?.length) {
        profilelink = "/profile/" + datausers[i]?.id;
        if (isWatchable(datausers[i]?.id))
          borderStatus = "orange";
        else if (datausers[i]?.status === 'online')
          borderStatus = '#1dd1a1';
        else if (datausers[i]?.status === 'offline')
          borderStatus = 'red';

        let j = 0;
        while (j < friends?.friends?.length) {
          if (datausers[i]?.id === friends?.friends[j]?.id) {
            indents.push(<div className="users-single-friends" key={i}>
              <div className='users-single-img'>
                <Link to={profilelink}><img style={{ 'borderColor': borderStatus }} src={datausers[i]?.avatar_url} alt="users"></img></Link>
              </div>
              <div className='users-single-info'>
                <h5>{datausers[i]?.name}</h5>
                <div className='users-single-info-friends'>
                <Tippy content="Private message" theme="custom" arrow=""><FontAwesomeIcon className='paperplane' icon={faPaperPlane} id={datausers[i]?.name} onClick={handleOpenPrivate} ></FontAwesomeIcon></Tippy>
                  {datausers[i]?.status === 'online' && <Tippy content="Invite to game" theme="custom" arrow=""><FontAwesomeIcon className='gamepad' icon={faGamepad} id={datausers[i]?.id} onClick={handleSendInvite}></FontAwesomeIcon></Tippy>}
                  {isBlocked(datausers[i]?.id) === 0 && <Tippy content="Block" theme="custom" arrow=""><FontAwesomeIcon style={{color: '#74b9ff'}} className='userslash' icon={faUserSlash} id={j.toString()} onClick={handleBlockFriend}></FontAwesomeIcon></Tippy>}
                  {isBlocked(datausers[i]?.id) === 1 && <Tippy content="Unblock" theme="custom" arrow=""><FontAwesomeIcon style={{color: 'red'}} className='userslash' icon={faUserSlash} id={j.toString()} onClick={handleUnBlockFriend}></FontAwesomeIcon></Tippy>}
                  <Tippy content="Remove friend" theme="custom" arrow=""><FontAwesomeIcon className='userxmark' icon={faUserXmark} id={j.toString()} onClick={handleRemoveFriend} ></FontAwesomeIcon></Tippy>
                  {isWatchable(datausers[i]?.id) === 1 && <Tippy content="Watch game" theme="custom" arrow=""><FontAwesomeIcon id={datausers[i]?.id} className='gameye' icon={faEye} onClick={handleWatchMode}></FontAwesomeIcon></Tippy>}
                </div>
              </div>
            </div>);
          }
          j++;
        }

        i++;
        borderStatus = 'white';
      }
    }
    if (switching === 2) {
      while (i < friendsrequest?.length) {
        indents.push(<div className='friendsrequest-single' key={i + 111}>
          <div className='friendsrequest-single-img'>
            <img src={friendsrequest[i].sender.avatar_url} alt="friends requests"></img>
          </div>
          <div className='friendsrequest-single-name'>
            <p>{friendsrequest[i]?.sender.name}</p>
          </div>
          <div className='friendsrequest-single-button'>
            <button id={i.toString()} onClick={handleAcceptFriend}>Accept</button>
          </div>
        </div>);
        i++;
      }
      // GAME REQUEST
      if (rFlag)
        rFlag++;
      i = 0;
      let index = 0;
      while (i < dataGR?.length)
      {
        let j = 0;
        while(j < datausers?.length)
        {
          if (dataGR[i]?.id === datausers[j]?.id)
            index = j;
          j++;
        }
          indents.push(<div className='friendsrequest-single' key={i + 112}>
            <div className='friendsrequest-single-img'>
              <img src={datausers[index].avatar_url} alt="friends requests"></img>
            </div>
            <div className='friendsrequest-single-name'>
              <p>{datausers[index].name}</p>
            </div>
            <div className='friendsrequest-single-button'>
              <button id={i.toString()} onClick={handleAcceptGame}>Play</button>
            </div>
          </div>);
        i++;
        index = 0;
      }
    }

    return indents;
  }

  // SEND MESSAGE TO CHANNEL
  const handleMessages = (e: any) => {
    e.preventDefault();
    if (!privMsgChat) {
      if (isInChan(e.currentTarget.id) === 0)
        return (0);
      socket.emit('sendChannelMessages', { chan: e.currentTarget.id, msg: message });
    }
    else if (privMsgChat) {
      let j = 0;
      while (j < datausers?.length) {
        if (e.currentTarget.id === datausers[j]?.name)
          socket.emit('privateMessage', { to: datausers[j], msg: message });
        j++;
      }
    }

    setMessage("");
  }

  // TO CHECK IS A USER IS A CHANNEL ADMIN
  function isAdmin(id: string, tmp: any) {
    let i = 0;
    while (i < tmp.adminsId.length) {
      if (id === tmp.adminsId[i])
        return (1);
      i++;
    }
    return (0);
  }

  function isOnline(id: string) {
    let i = 0;
    while (i < datausers?.length) {
      if (datausers[i]?.id === id) {
        if (datausers[i]?.status === 'online')
          return (1);
      }
      i++;
    }
    return (0);
  }

  // HANDLE FUNCTIONS FOR CHANNEL OPERATIONS
  function handleSetAdmin(chan: string, id: string) {
    socket.emit('setAdmin', { channel: chan, toSetAdmin: id });
  }
  function handleBanUser(chan: string, id: string) {
    socket.emit('banUser', { channel: chan, toBan: id });
  }
  function handleMuteUser(chan: string, id: string) {
    socket.emit('muteUser', { channel: chan, toMute: id });
  }

  // DISPLAY CHANNEL OPERATIONS NEXT TO PSEUDO/HOURS
  function displayChanOp(i: number, tmp: any) {
    if (datame.name === tmp.messages[i]?.sender.name) // si c'est moi-meme j'affiche rien
    {
      return ("");
    }
    else if (isAdmin(datame.id, tmp)) // si je suis admin
    {
      if (isAdmin(tmp.messages[i]?.sender.id, tmp))// si c'est un autre admin j'affiche que le gamepad
      {
        return (
          <div className='chat-chanOp'>
            {isOnline(tmp.messages[i]?.sender.id) === 1 && <Tippy content="Invite to game" theme="custom" arrow=""><FontAwesomeIcon icon={faGamepad} className="gamepadchan" id={tmp.messages[i]?.sender.id} onClick={handleSendInvite}></FontAwesomeIcon></Tippy>}
          </div>
        );
      }
      else // sinon j'affiche tout
      {
        return (
          <div className='chat-chanOp'>
            {isOnline(tmp.messages[i]?.sender.id) === 1 && <Tippy content="Invite to game" theme="custom" arrow=""><FontAwesomeIcon icon={faGamepad} className="gamepadchan" id={tmp.messages[i]?.sender.id} onClick={handleSendInvite}></FontAwesomeIcon></Tippy>}
            <Tippy content="Set admin" theme="custom" arrow=""><FontAwesomeIcon onClick={() => handleSetAdmin(tmp.name, tmp.messages[i]?.sender)} icon={faHandsHoldingCircle} className="handsholding"></FontAwesomeIcon></Tippy>
            <Tippy content="Ban" theme="custom" arrow=""><FontAwesomeIcon onClick={() => handleBanUser(tmp.name, tmp.messages[i]?.sender)} icon={faBan} className="ban"></FontAwesomeIcon></Tippy>
            <Tippy content="Mute" theme="custom" arrow=""><FontAwesomeIcon onClick={() => handleMuteUser(tmp.name, tmp.messages[i]?.sender)} icon={faCommentSlash} className="commentslash"></FontAwesomeIcon></Tippy>
          </div>
        );
      }
    }
    else {
      return (
        <div className='chat-chanOp'>
          {isOnline(tmp.messages[i]?.sender.id) === 1 && <Tippy content="Invite to game" theme="custom" arrow=""><FontAwesomeIcon icon={faGamepad} className="gamepadchan" id={tmp.messages[i]?.sender.id} onClick={handleSendInvite}></FontAwesomeIcon></Tippy>}
        </div>
      );
    }
  }

  // DISPLAY MESSAGES IN THE CHAT
  // need to reverse printing the array of messages because of
  // chat box displaying from bottom to top
  function display_msg() {
    let i;
    if (messages)
      i = messages.messages?.length - 1;
    let msgColor = 'bisque';
    let profilelink;

    if (messages) {
      if (chanName === messages.name) {
        tmp = messages;
        ispriv = 0;
      }
      else if (chanName === privTarget[0] || chanName === privTarget[1]) {
        tmp = messagesPriv;
        ispriv = 1;
      }
    }
    if (tmp && !ispriv) {
      indents = [];
      i = tmp.messages?.length - 1;
      while (i >= 0) {
        profilelink = "/profile/" + tmp.messages[i]?.sender.id;

        if (datame.name === tmp.messages[i]?.sender.name)
          msgColor = 'rgba(116, 185, 255, 1)';
          if (tmp.messages[i]?.sender.name === "chatBot")
            msgColor = 'rgba(240, 147, 43)';

        indents.push(<div className='chat-message' key={i}>
          <div className='chat-message-info'>
          {tmp.messages[i]?.sender.name === "chatBot" && <FontAwesomeIcon icon={faRobot} className="robot"></FontAwesomeIcon>}
            <Link to={profilelink} style={{ textDecoration: 'none', color: 'black' }}><h5>{tmp.messages[i]?.sender.name}</h5></Link>
            <span>{tmp.messages[i]?.sent_at.substr(0, 8)}</span>
            {tmp.messages[i]?.sender.name !== "chatBot" && displayChanOp(i, tmp)}
          </div>
          <p style={{ 'color': msgColor }}>{tmp.messages[i]?.message}</p>
        </div>);
        i--;
        msgColor = 'bisque';
      }
    }
    else if (tmp && ispriv === 1) {
      indents = [];
      i = tmp?.length - 1;
      while (i >= 0) {
        profilelink = "/profile/" + tmp[i]?.sender.id;
        if (datame.name === tmp[i]?.sender.name)
          msgColor = 'rgba(116, 185, 255, 1)';

        indents.push(<div className='chat-message' key={i}>
          <div className='chat-message-info'>
            <Link to={profilelink} style={{ textDecoration: 'none', color: 'black' }}><h5>{tmp[i]?.sender.name}</h5></Link>
            <span>{tmp[i]?.sent_at.substr(0, 8)}</span>
            {isOnline(tmp[i]?.sender.id) === 1 && <Tippy content="Invite to game" theme="custom" arrow=""><FontAwesomeIcon icon={faGamepad} className="gamepadpriv" id={tmp[i]?.sender.id} onClick={handleSendInvite} ></FontAwesomeIcon></Tippy>}
          </div>
          <p style={{ 'color': msgColor }}>{tmp[i]?.message}</p>
        </div>);
        i--;
        msgColor = 'bisque';
      }
    }

    return indents;
  }

  // IS MAIN USER IN THE TARGETED CHANNEL
  const isInChan = (str: string) => {
    let i = 0;
    while (i < data?.length) {
      let j = 0;
      while (j < data[i]?.users.length) {
        if (datame.name === data[i].users[j]?.name)
          if (str === data[i]?.name)
            return (1);
        j++;
      }
      i++;
    }
    return (0);
  }

  const handleSetPass = (e: any) => {
    e.preventDefault();
    socket.emit('modifyChanSettings', { chanName: chanName, password: chanOpPass });
    setChanOpPass("");
  }

  const handleUnsetPass = (e: any) => {
    e.preventDefault();
    socket.emit('modifyChanSettings', { chanName: chanName });
    setChanOpPass("");
  }

  const handleAddMembersPrivate = (e: any) => {
    e.preventDefault();
    let i = 0;
    while (i < friends?.friends?.length) {
      if (friends?.friends[i]?.name === chanOpPass)
        socket.emit('addUser', { user: friends.friends[i], chanName: chanName });
      i++;
    }
    setChanOpPass("");
  }

  function chanOwnerOp() {
    let i = 0;
    while (i < data?.length) {
      if (data[i]?.ownerId === datame.id) {
        if (data[i]?.name === chanName) {
          if (!data[i]?.private) {
            if (data[i]?.password_protected) // change / unset
            {
              return (
                <div className='chat-owner-op'>
                  <form onSubmit={handleSetPass}>
                    <input
                      type="text"
                      value={chanOpPass}
                      placeholder="Change Password"
                      onChange={(e) => setChanOpPass(e.target.value)}
                    />
                  </form>
                  <button onClick={handleUnsetPass}>UNSET</button>
                </div>
              )
            }
            else if (!data[i]?.password_protected) //set
            {
              return (
                <div className='chat-owner-op'>
                  <form onSubmit={handleSetPass}>
                    <input
                      type="text"
                      value={chanOpPass}
                      placeholder="Set Password"
                      onChange={(e) => setChanOpPass(e.target.value)}
                    />
                  </form>
                </div>
              )
            }
          }
          else if (data[i]?.private) //add members
          {
            return (
              <div className='chat-owner-op'>
                <datalist id="mylist">
                  {friends.friends.map((item:any,index:any)=>{
                  return  <option key={index} value={friends.friends[index].name} />;})}
                </datalist>
                <form onSubmit={handleAddMembersPrivate}>
                  <input
                  type="search"
                  list="mylist"
                  value={chanOpPass}
                  placeholder="Add Members"
                  onChange={(e) => setChanOpPass(e.target.value)}
                  />
                </form>
              </div>
            )
          }
        }
      }
      i++;
    }
    return ("");
  }

  // DISPLAY CHAT
  const display_chat = (e: any) => {
    if (!DisplayChat)
      return ("");

    return (
      <div className='chat-wrapper'>
        <div className='chat-title'>#{chanName.toUpperCase()}</div>
        {chanOwnerOp()}
        <div className='chat-box'>
          {display_msg()}
        </div>
        <form className='chat-input' id={chanName} onSubmit={handleMessages}>
          <input
            type="text"
            value={message}
            placeholder="Aa"
            onChange={(e) => setMessage(e.target.value)}
          />
        </form>
      </div>
    )
  }

  function handleUsers() {
    if (switching !== 0)
    {
      setUsersBtnColor('rgba(29, 209, 161, 0.5)');
      setFriendsBtnColor('rgba(116, 185, 255, 0.3)');
      setRequestsBtnColor('rgba(240, 147, 43, 0.3)');
      setSwitching(0);
    }
  }
  function handleFriends() {
    if (switching !== 1)
    {
      setUsersBtnColor('rgba(29, 209, 161, 0.3)');
      setFriendsBtnColor('rgba(116, 185, 255, 0.5)');
      setRequestsBtnColor('rgba(240, 147, 43, 0.3)');
      setSwitching(1);
    }
  }
  function handleRequests() {
    if (switching !== 2)
    {
      setUsersBtnColor('rgba(29, 209, 161, 0.3)');
      setFriendsBtnColor('rgba(116, 185, 255, 0.3)');
      setRequestsBtnColor('rgba(240, 147, 43, 0.5)');
      setSwitching(2);
    }
  }

  function display_ChanCreation() {

    if (publicChan === 3) {
      return (
        <div className='channels-creation-selection-plus'>
          <button onClick={() => setPublicChan(2)}>+</button>
        </div>
      )
    }
    else if (publicChan === 2) {
      return (
        <div className='channels-creation-selection'>
          <button onClick={() => setPublicChan(1)}>PUBLIC</button>
          <button onClick={() => setPublicChan(0)}>PRIVATE</button>
        </div>
      )
    }
    else if (publicChan === 1) {
      return (
        <div className='channels-creation-selection'>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              value={name}
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">ADD</button>
          </form>
        </div>
      )
    }
    else if (publicChan === 0) {
      return (
        <div className='channels-creation-selection'>
          <form onSubmit={handleCreate}>
            <input
              type="text"
              value={name}
              placeholder="Name"
              onChange={(e) => setName(e.target.value)}
            />
            <button type="submit">ADD</button>
          </form>
        </div>
      )
    }
  }

  // PAGE RENDER
  return (

    <div className='community-container'>

      <Particles id="tsparticles" init={particlesInit} options={cfg}/>

      <div className='channels-container'>
        {display_ChanCreation()}
        <div className="channels-list">
          {display_chan()}
        </div>
      </div>

      <div className='chat-container'>
        {display_chat(DisplayChat)}
      </div>

      <div className='users-container'>
        <div className='users-tab'>
          <button style={{ backgroundColor: UsersBtnColor, borderColor: '#1dd1a1', color: '#1dd1a1' }} onClick={handleUsers}>USERS</button>
          <button style={{ backgroundColor: FriendsBtnColor, borderColor: '#74b9ff', color: '#74b9ff' }} onClick={handleFriends}>FRIENDS</button>
          <button style={{ backgroundColor: RequestsBtnColor, borderColor: '#f0932b', color: '#f0932b' }} onClick={handleRequests}>REQUESTS</button>
        </div>
        <div className='users-list'>
          {display_users()}
        </div>
      </div>

    </div>
  )
}
