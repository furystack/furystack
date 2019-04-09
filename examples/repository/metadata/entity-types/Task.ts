
/**
 * Model for Entity Type Task
 * Primary key: 'id'
 */
export class Task {

    
    public user!: import('./User').User;
    public users!: Array<import('./User').User>;

    
    public id!: string;
}
