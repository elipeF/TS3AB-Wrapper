import * as request from 'supertest';
import { v4 } from 'uuid';

const app = 'http://localhost:8080';
let id;
describe('App', () => {
  it('Should ping', () => {
    return request(app)
      .get('/')
      .expect(200)
      .expect('Ok');
  });
});

describe('Create bot', () => {
  id = v4();
  it('Should create bot', () => {
    return request(app)
      .post('/bot')
      .send({ id })
      .set('Accept', 'application/json')
      .expect(201);
  });

  it('Should reject dupicate bot', () => {
    return request(app)
      .post('/bot')
      .send({ id })
      .set('Accept', 'application/json')
      .expect(422);
  });

  it('Should reject empty post', () => {
    return request(app)
      .post('/bot')
      .send({})
      .set('Accept', 'application/json')
      .expect(({ body }) => {
        expect(body.statusCode).toEqual(400);
        expect(body.message[0]).toEqual('id must be an UUID');
      })
      .expect(400);
  });

  it('Should reject invalid id', () => {
    return request(app)
      .post('/bot')
      .send({ id: `${id}+xxx` })
      .set('Accept', 'application/json')
      .expect(({ body }) => {
        expect(body.statusCode).toEqual(400);
        expect(body.message[0]).toEqual('id must be an UUID');
      })
      .expect(400);
  });
});

describe('Bot count', () => {
  it('Should get count of bots', () => {
    return request(app)
      .get('/bot/count')
      .expect(({ body }) => {
        expect(body.bots).toBeDefined();
        expect(body.running).toBeDefined();
      })
      .expect(200);
  });
});

describe('Bot edit', () => {
  it('Should return bot status', () => {
    return request(app)
      .get('/bot/' + id)
      .expect(({ body }) => {
        expect(body.language).toEqual('en');
        expect(body.status).toEqual(0);
        expect(body.address).toBeDefined();
        expect(body.name).toEqual('TS3AudioBot');
        expect(body.channel).toBeDefined();
      })
      .expect(200);
  });

  it('Should change bot name', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ name: 'Testtt' })
      .expect(200);
  });

  it('Should reject change bot name', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ name: '12' })
      .expect(400);
  });

  it('Should reject change bot name', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({
        name: 'TestttTestttTestttTestttTestttTestttTestttTestttTestttTesttt',
      })
      .expect(400);
  });

  it('Should return new name', () => {
    return request(app)
      .get('/bot/' + id)
      .expect(({ body }) => {
        expect(body.name).toEqual('Testtt');
      })
      .expect(200);
  });

  it('Should change bot channel', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ channel: 2 })
      .expect(200);
  });

  it('Should reject change bot channel', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ channel: '2' })
      .expect(400);
  });

  it('Should return new channel', () => {
    return request(app)
      .get('/bot/' + id)
      .expect(({ body }) => {
        expect(body.channel).toEqual(2);
      })
      .expect(200);
  });

  it('Should change bot language', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ language: 'pl' })
      .expect(200);
  });

  it('Should reject bot language', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ language: 'polski' })
      .expect(400);
  });

  it('Should return new language', () => {
    return request(app)
      .get('/bot/' + id)
      .expect(({ body }) => {
        expect(body.language).toEqual('pl');
      })
      .expect(200);
  });

  it('Should change bot server', () => {
    return request(app)
      .patch('/bot/' + id)
      .send({ address: 'localhost' })
      .expect(200);
  });

  it('Should return new server and status online', done => {
    setTimeout(async () => {
      await request(app)
        .get('/bot/' + id)
        .expect(({ body }) => {
          expect(body.address).toEqual('localhost');
          expect(body.status).toEqual(2);
        })
        .expect(200);
      done();
    }, 500);
  });

  it('Should stop bot', () => {
    return request(app)
      .get('/bot/' + id + '/stop')
      .expect(200);
  });

  it('Should return stoped bot', done => {
    setTimeout(async () => {
      await request(app)
        .get('/bot/' + id)
        .expect(({ body }) => {
          expect(body.status).toEqual(0);
        })
        .expect(200);
      done();
    }, 500);
  });

  it('Should start bot', () => {
    return request(app)
      .get('/bot/' + id + '/start')
      .expect(200);
  });

  it('Should return started bot', done => {
    setTimeout(async () => {
      await request(app)
        .get('/bot/' + id)
        .expect(({ body }) => {
          expect(body.status).toEqual(2);
        })
        .expect(200);
      done();
    }, 2000);
  });
});

describe('Bot rights', () => {
  it('Should return rights', () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });

  it('Should reject rights for invalid id', () => {
    return request(app)
      .get(`/bot/${id + 'sdd'}/rights`)
      .expect(({ body }) => {
        expect(body.statusCode).toEqual(400);
        expect(body.message[0]).toEqual('id must be an UUID');
      })
      .expect(400);
  });

  const uid = 'BIWAeh/t6b7c8vGusexEyvRy6rQ=';
  const gid = 2;
  it('Should reject wrong rights level', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ useruid: uid, level: 'superadmin' })
      .expect(400);
  });

  it('Should add admin right uniq', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ useruid: uid, level: 'admin' })
      .expect(201);
  });

  it(`Should return ${uid} as admin`, () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([uid]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });

  it('Should add admin right group', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ groupid: gid, level: 'admin' })
      .expect(201);
  });

  it(`Should return ${gid} as admin`, () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([uid]);
        expect(body.admins.groupid).toEqual([gid]);
      })
      .expect(200);
  });

  it('Should not remove admin rights for wrong user', () => {
    return request(app)
      .delete(`/bot/${id}/rights`)
      .send({ useruid: uid + 'sss', level: 'admin' })
      .expect(404);
  });

  it(`Should return ${uid} as admin`, () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([uid]);
        expect(body.admins.groupid).toEqual([gid]);
      })
      .expect(200);
  });

  it('Should remove admin rights uid', () => {
    return request(app)
      .delete(`/bot/${id}/rights`)
      .send({ useruid: uid, level: 'admin' })
      .expect(200);
  });

  it('Should return empty admin uniq', () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([gid]);
      })
      .expect(200);
  });

  it('Should remove admin rights gid', () => {
    return request(app)
      .delete(`/bot/${id}/rights`)
      .send({ groupid: gid, level: 'admin' })
      .expect(200);
  });


  it('Should return empty admin', () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });

  it('Should add user rights uid', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ useruid: uid, level: 'user' })
      .expect(201);
  });

  it(`Should return ${uid} as user`, () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([uid]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });

  it('Should add user rights gid', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ groupid: gid, level: 'user' })
      .expect(201);
  });

  it(`Should return ${gid} as user`, () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([uid]);
        expect(body.users.groupid).toEqual([gid]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });

  it('Should remove user uniq rights', () => {
    return request(app)
      .delete(`/bot/${id}/rights`)
      .send({ useruid: uid, level: 'user' })
      .expect(200);
  });

  it('Should return empty uniq rights', () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([gid]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });


  it('Should remove user gid rights', () => {
    return request(app)
      .delete(`/bot/${id}/rights`)
      .send({ groupid: gid, level: 'user' })
      .expect(200);
  });

  it('Should return empty rights', () => {
    return request(app)
      .get(`/bot/${id}/rights`)
      .expect(({ body }) => {
        expect(body.bot).toEqual(id);
        expect(body.users.useruid).toEqual([]);
        expect(body.users.groupid).toEqual([]);
        expect(body.admins.useruid).toEqual([]);
        expect(body.admins.groupid).toEqual([]);
      })
      .expect(200);
  });

  it('Should reject add user rights without level', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ useruid: uid })
      .expect(400);
  });

  it('Should reject add user rights with wrong level', () => {
    return request(app)
      .post(`/bot/${id}/rights`)
      .send({ useruid: uid, level: 'ddd' })
      .expect(400);
  });
});

describe('Bot remove', () => {
  it('Should remove bot', () => {
    return request(app)
      .delete('/bot/' + id)
      .expect(200);
  });
});
