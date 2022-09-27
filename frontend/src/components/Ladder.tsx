import { useEffect, useState } from "react";

import Particles from "react-particles";
import { loadFull } from "tsparticles";
const particlesInit = async (main:any) => {await loadFull(main);};
import { cfg } from "./particles-cfg"

export default function Ladder() {

	const [ladder, setLadder] = useState<any>([]);
    const indents : any = [];
    let i = 0;
    let rank = 1;

	useEffect(()  =>  {
		const getData = async () => {
			const response = await fetch(
				`/api/game/ladder`
			);
			const actualData = await response.json();
			setLadder(actualData);
		}
		 getData()
		}, [])

    while (i < ladder?.length)
    {
    if (ladder[i].name !== "chatBot")
      indents.push(
            <div className='ladder-line' key={i}>
				<div className='ladder-rank'><h5>#</h5>{rank++}</div>
				<div className="ladder-img"><img src={ladder[i].avatar_url} alt="avatar"></img></div>
                <div className='ladder-name'>{ladder[i].name}</div>
                <div className='ladder-victories'><h5>VICTORIES :&nbsp;</h5>{ladder[i].wonMatches}</div>
            </div>
        );
        i++;
    }

    return (
        <div>
            <Particles id="tsparticles" init={particlesInit} options={cfg}/>
            <div className='ladder-container'>
                {indents}
            </div>
        </div>
    )
}
