


import { channelMessage } from "../message/channelMessage.entity";
import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from "typeorm";
import { User } from "../user/user.entity";

@Entity('Channels')
export class Channel extends BaseEntity {

	@PrimaryGeneratedColumn("uuid")
	id: string;

	@Column({
		type: 'varchar',
		unique: true
	})
	name: string;

	@Column({
		type: 'boolean',
		default: false,
	})
	password_protected: boolean

	@Column({
		type: 'boolean',
		default: false,
	})
	private: boolean

	@Column({
		type: 'varchar',
		default: null,
		nullable: true,
		select: false
	})
	password: string

	@ManyToOne(() => User, { nullable: true, cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete'})
	owner: User;

	@RelationId((channel: Channel) => channel.owner)
	ownerId: string;

	@ManyToMany(() => User, { nullable: true, cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
	@JoinTable()
	admins: User[];

	@RelationId((channel: Channel) => channel.admins)
	adminsId: string[];

	@ManyToMany(() => User, { nullable: true, cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete' })
	@JoinTable()
	@JoinColumn({ name: 'mutedId' })
	muted: User[];

	@RelationId((channel: Channel) => channel.muted)
	mutedId: string[];

	@ManyToMany(() => User, user => user.channels, { cascade: true, onDelete: 'CASCADE', orphanedRowAction: 'delete'})
	@JoinTable()
	users: User[]

	@OneToMany(() => channelMessage, (channelMessage) => channelMessage.target)
	messages: channelMessage[];

	@ManyToMany(() => User)
	@JoinTable()
	banned: User[];

	@RelationId((channel: Channel) => channel.banned)
	bannedId: string[];

}
