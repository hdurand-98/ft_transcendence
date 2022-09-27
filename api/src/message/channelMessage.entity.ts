
import { Channel } from "../channel/channel.entity";
import { User } from "../user/user.entity";
import { Entity, JoinColumn, ManyToOne } from "typeorm";
import { AMessage } from "./AMessage.entity";

@Entity('channelMessage')
export class channelMessage extends AMessage {

	@ManyToOne(() => User, user => user.channelMessages)
	@JoinColumn()
	sender: User;

	@ManyToOne(() => Channel,  channel => channel.messages, { cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete'})
	target: Channel;

}
