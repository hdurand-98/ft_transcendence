import { User } from "../user/user.entity";
import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from "typeorm";

export enum Achievements_types {
	WINNER = "Incredible start",
	LOSER = "Miserable start",
	FIRST = "First victory",
	HALFHALF = "50/50 : Perfect balance between loss and success",
	CHANNELLEADER = "Channel Leader - Is owner of at least three channels",
	NOBODYLOVESYOU = "Nobody Loves You - Banned from a channel"
}


@Entity('Achievements')
export class Achievements extends BaseEntity
{
	@PrimaryGeneratedColumn()
	id: string;

	@ManyToOne(() => User)
	@JoinColumn()
	user: User;

	@Column({
		type: 'text',
	})
	@Column()
	achievement_list: Achievements_types;
}
