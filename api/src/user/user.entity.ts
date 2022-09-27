
import { channelMessage } from "../message/channelMessage.entity";
import { BaseEntity, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Channel } from "../channel/channel.entity";

@Entity('Users') /** table name */
export class User extends BaseEntity {

	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: 'varchar',
		unique: true,
	})
	name: string;

	@Column({
		type: 'varchar',
	})
	fullname: string;

	@Column({
		type: 'varchar',
	})
	mail: string;

	@Column({
		type: 'int',
		unique: true
	})
	intra_id: number;

	@Column({
		type: 'varchar'
	})
	avatar_url: string;

	@Column({
		type: 'int',
		default: 0
	})
	wonMatches: number;

	@Column({
		type: 'int',
		default: 0
	})
	lostMatches: number;

	@Column({
		nullable: true,
		select: false
	})
	TwoFA_secret: string;

	@Column({
		type: 'boolean',
		default: false
	})
	TwoFA_enable: boolean;

	@Column({
		nullable: true,
		default: true,
		select: false,
		type: 'varchar'
	})
	status: string;

	@ManyToMany(() => Channel, channel => channel.users)
	@JoinTable()
	channels: Channel[];

	@OneToMany(() => channelMessage, channelMessage => channelMessage.sender)
	channelMessages: channelMessage[];

	@ManyToMany(() => User, user => user.friends)
	@JoinTable()
	friends: User[];

	@Column('varchar', { array: true, nullable : false, default: []})
	blocked: string[];

}
