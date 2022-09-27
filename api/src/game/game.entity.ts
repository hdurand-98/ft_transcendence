import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('MatchHistory') /** table name */
export class MatchHistory extends BaseEntity {

	@PrimaryGeneratedColumn("uuid")  // id du match
	id: string;

	@Column({ type: 'boolean', default: 'false' })
	finished: boolean;

	@CreateDateColumn()
	startTime: Date;

	@Column({ nullable : true })
	stopTime: Date;

	@Column("uuid")
	user1: string; //on stocke juste les uuid des joueurs, pas de relations

	@Column("uuid")
	user2: string;

	@Column({ nullable : true }) // au debut c nul
	scoreUser1: number;

	@Column({ nullable : true })
	scoreUser2: number;
}
