import { Injectable } from "@nestjs/common";

@Injectable()
export class ListingsService {
  async findAll(query: any) {
    return { data: [], meta: { total: 0, limit: 20, cursor: null, hasMore: false } };
  }

  async findOne(id: string) {
    return null;
  }

  async create(userId: string, data: any) {
    return null;
  }

  async update(id: string, userId: string, data: any) {
    return null;
  }

  async delete(id: string, userId: string) {
    return null;
  }
}
