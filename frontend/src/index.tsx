import "./index.css"
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import Auth from './components/Auth';
import { Navigate, BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import TwoFactor from './components/TwoFactor';
import Profile from './components/Profile';
import Channels from './components/Channels-add';
import Game from './components/Game';
import { CookiesProvider, useCookies } from "react-cookie";
import io from 'socket.io-client';
import PublicProfile from './components/PublicProfile';
import jwtDecode from 'jwt-decode';
import Ladder from "./components/Ladder";
import Home from "./components/Home";
import NotFound from "./components/NotFound";

export const socketo = io();
export const dataGR: any = [];

      socketo.on('accept invite', (id: string, mode:number) => {
        function isInArray(id:string){
          let j = 0;
          while (j < dataGR?.length)
          {
            if (dataGR[j].id === id)
              return (1);
            j++;
          }
          return (0);
        }
        if (!isInArray(id))
          dataGR.push({id:id, mode:mode});
      });

/**
 * Check if a cookie is present and if token is valid. Can't check every case, for exemple if
 * server change secret, this token can be valid client side, but not server side. This will occur
 * in a lot of uncaught 401. Maybe a check at each fetch would be necessary
 * @param param0 Don't know, react magic !
 * @returns Don't know react magic again !
 */
function RequireAuth({ children }: { children: JSX.Element }) {
  const [cookies, ] = useCookies();
  const location = useLocation();

  if (!cookies.Authentication) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  const token: any = jwtDecode(cookies.Authentication)
  const dateNow = new Date();
  if (token.exp * 1000 < dateNow.getTime()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (token.isSecondFactorAuthenticated === false && location.pathname !== '/2fa') {
    return <Navigate to="/2fa" state={{ from: location }} replace />;
  }
  if (token.isSecondFactorAuthenticated === true && location.pathname === '/2fa') {
    return <Navigate to="/" />;
  }
  return children;
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <CookiesProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/" element={<><Header /><RequireAuth><Home /></RequireAuth></>} />
        <Route path="/2fa" element={<><RequireAuth><TwoFactor /></RequireAuth></>} />
        <Route path="/profile/me" element={<><Header /><RequireAuth><Profile /></RequireAuth></>} />
        <Route path="/profile/:uuid" element={<><Header /><RequireAuth><PublicProfile /></RequireAuth></>} />
        <Route path="/community" element={<><Header /><RequireAuth><Channels /></RequireAuth></>} />
        <Route path="/ladder" element={<><Header /><RequireAuth><Ladder /></RequireAuth></>} />
        <Route path="/game" element={<><Header /><RequireAuth><Game /></RequireAuth></>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </CookiesProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
