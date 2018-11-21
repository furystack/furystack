import { FindOneOptions, Repository } from "typeorm";

export abstract class AbstractStore<T, K = string> {
    protected values = new Map<K, T>();
    protected abstract getFindOptionFromItem(item: T): FindOneOptions<T>;
    protected abstract getFindOptionFromKey(key: K): FindOneOptions<T>;
    protected abstract getKeyFromItem(item: T): K;
    public async update(value: T, repository: Repository<T>) {
        const existing = await repository.findOne(this.getFindOptionFromItem(value));
        if (!existing) {
            const saved = await repository.save(value as any);
            this.values.set(this.getKeyFromItem(value), saved);
            return saved;
        }
        const merged = repository.merge(existing, value as any);
        const updated = await repository.save(merged as any);
        this.values.set(this.getKeyFromItem(value), updated);
        return updated;
    }

    public async get(key: K, repository: Repository<T>) {
        if (this.values.has(key)) {
            return this.values.get(key);
        }
        const result = await repository.findOneOrFail(this.getFindOptionFromKey(key));
        this.values.set(key, result);
        return result;
    }
}
