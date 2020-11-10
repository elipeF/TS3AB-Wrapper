import {
  Injectable,
  HttpException,
  HttpStatus,
  HttpService,
} from '@nestjs/common';
import { TomlReaderService } from '../toml-reader/toml-reader.service';
import { Rights } from './../../src/rights';
import { AxiosError } from 'axios';
import { RightsParserService } from '../rights-parser/rights-parser.service';
import { BotEdit } from 'src/bot-edit';
import { RightsRequest } from 'src/rights-request';

interface BotObj {
  Id: number;
  Name: string;
  Server: string;
  Status: number;
}

function unicodeURLEncode(text) {
  return encodeURIComponent(text).replace(/[!'()*]/g, function(c) {
      return ('%' + c.charCodeAt(0).toString(16).toUpperCase());
  });
}

@Injectable()
export class BotService {
  constructor(
    private tomlReader: TomlReaderService,
    private httpService: HttpService,
    private rightsParser: RightsParserService,
  ) {}

  async getInf(id: string) {
    const bot = await this.findBot(id);
    const { data } = await this.httpService
      .get(process.env.TS3AUDIOBOT_URL + 'settings/bot/get/' + id)
      .toPromise();
    const {
      language,
      connect: { name, channel, address },
    } = data;
    return {
      language,
      status: bot.Status,
      address,
      name,
      channel: parseInt(channel.replace('/', ''))
        ? parseInt(channel.replace('/', ''))
        : 0,
      commander: /(?<=bot commander )[^\)]+(?=\))/.exec(data.events.onconnect)?.[0] === "on" ? true : false ?? false,
      song: /(?<=play )[^\)]+(?=\))/.exec(data.events.onconnect)?.[0] ?? '',
      volume: +(/(?<=vol )[^\)]+(?=\))/.exec(data.events.onconnect)?.[0] ?? 50)
    };
  }

  async server(id: string) {
    const bot = await this.findBot(id);
    if (bot.Status !== 2) {
      throw new HttpException(
        'Bot not running',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const server = await this.httpService
      .get(process.env.TS3AUDIOBOT_URL + `bot/use/${bot.Id}/(/server/tree)`)
      .toPromise();

      const users = Object.keys(server.data.Clients)
      .filter(key => +key !== server.data.OwnClient ? true : false)
      .map(key => { 
        return {
          cid: server.data.Clients[key].Channel,
          uniq: server.data.Clients[key].Uid,
          name: server.data.Clients[key].Name,
        }});
    return {
      botcid: server.data.Clients[server.data.OwnClient].Channel,
      users,
    };
  }

  async rights(id: string) {
    const rights = await this.tomlReader.readFileAsyncAndParse();
    const rule = rights.rule.filter((el: Rights) => {
      if (el.bot && el.bot[0] === id) {
        return el;
      }
    });
    try {
      return {
        bot: rule[0].bot[0],
        users: {
          useruid: rule[0].rule[1].useruid,
          groupid: rule[0].rule[1].groupid,
        },
        admins: {
          useruid: rule[0].rule[0].useruid,
          groupid: rule[0].rule[0].groupid,
        },
      };
    } catch (e) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
  }

  async addRights(id: string, request: RightsRequest) {
    try {
      if (request.groupid == null && request.useruid == null) {
        throw new HttpException(
          'UserID or GroupID must be provided',
          HttpStatus.BAD_REQUEST,
        );
      }
      const rights = await this.tomlReader.readFileAsyncAndParse();
      rights.rule = this.rightsParser.addRight(id, request, rights.rule);
      await this.tomlReader.writeFileAsync(rights);
      await this.httpService
        .get(process.env.TS3AUDIOBOT_URL + 'rights/reload')
        .toPromise();
    } catch (e) {
      console.log(e);
      throw new HttpException(
        'Unable to process req',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeRights(id: string, request: RightsRequest) {
    const rights = await this.tomlReader.readFileAsyncAndParse();
    rights.rule = this.rightsParser.removeRight(id, request, rights.rule);
    await this.tomlReader.writeFileAsync(rights);
    try {
      await this.httpService
        .get(process.env.TS3AUDIOBOT_URL + 'rights/reload')
        .toPromise();
    } catch (e) {
      console.log(e);
      throw new HttpException(
        'Unable to process req',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async create(id: string) {
    const botId = id;
    try {
      const botReq = await this.httpService
        .get(process.env.TS3AUDIOBOT_URL + `settings/create/${botId}`)
        .toPromise();
      if (botReq.status === 204) {
        const rights = await this.tomlReader.readFileAsyncAndParse();
        rights.rule.push(this.rightsParser.addNewBot(botId));
        await this.tomlReader.writeFileAsync(rights);
        return;
      } else {
        throw new HttpException(
          `Can't create new bot`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (e) {
      const er: AxiosError = e;
      if (er.response && er.response.status === 422) {
        throw new HttpException('Bot exist', 422);
      }
      console.log(e);
    }
  }

  async edit(id: string, settings: BotEdit) {
    const bot = await this.findBot(id);
    const enable = bot.Status === 2 ? true : false;
    if (settings.language) {
      await this.httpService
        .get(
          process.env.TS3AUDIOBOT_URL +
            `settings/bot/set/${id}/language/${settings.language}`,
        )
        .toPromise();
    }
    if (settings.name) {
      await this.httpService
        .get(
          process.env.TS3AUDIOBOT_URL +
            `settings/bot/set/${id}/connect.name/${encodeURIComponent(
              settings.name,
            )}`,
        )
        .toPromise();
      if (enable) {
        try {
          await this.httpService
            .get(
              process.env.TS3AUDIOBOT_URL +
                `bot/use/${bot.Id}/(/bot/name/${encodeURIComponent(
                  settings.name,
                )})`,
            )
            .toPromise();
        } catch (e) {
          const er: AxiosError = e;
          if (er.response.status === 422 && er.response.data.ErrorMessage) {
            throw new HttpException(
              er.response.data.ErrorMessage,
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          } else {
            throw new HttpException(
              'Unknow error',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
        }
      }
    }
    if (settings.channel) {
      await this.httpService
        .get(
          process.env.TS3AUDIOBOT_URL +
            `settings/bot/set/${id}/connect.channel/${encodeURIComponent(
              '/' + settings.channel,
            )}`,
        )
        .toPromise();
      if (enable) {
        try {
          await this.httpService
            .get(
              process.env.TS3AUDIOBOT_URL +
                `bot/use/${bot.Id}/(/bot/move/${encodeURIComponent(
                  settings.channel,
                )})`,
            )
            .toPromise();
        } catch (e) {
          const er: AxiosError = e;
          if (er.response.status === 422 && er.response.data.ErrorMessage) {
            throw new HttpException(
              er.response.data.ErrorMessage,
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          } else {
            console.log(e);
            throw new HttpException(
              'Unknow error',
              HttpStatus.UNPROCESSABLE_ENTITY,
            );
          }
        }
      }
    }
    if (settings.address) {
      await this.httpService
        .get(
          process.env.TS3AUDIOBOT_URL +
            `settings/bot/set/${id}/connect.address/${encodeURIComponent(
              settings.address,
            )}`,
        )
        .toPromise();
      if (enable) {
        await this.httpService
          .get(
            process.env.TS3AUDIOBOT_URL + `bot/use/${bot.Id}/(/bot/disconnect)`,
          )
          .toPromise();
        await this.httpService
          .get(process.env.TS3AUDIOBOT_URL + `bot/connect/template/${id}`)
          .toPromise();
      } else {
        await this.httpService
          .get(process.env.TS3AUDIOBOT_URL + `bot/connect/template/${id}`)
          .toPromise();
      }
    }
    if(settings.commander !== undefined || settings.song || settings.volume) {
      const currentSettings = await this.getInf(id);
      let command = '!xecute';
      
      command = command + `(!bot commander ${(settings.commander ?? currentSettings.commander) ? 'on' : 'off'})`;
      command = command + `(!play ${settings.song ?? currentSettings.song})`;
      command = command + `(!vol ${settings.volume ?? currentSettings.volume})`;

      await this.httpService
        .get(
          process.env.TS3AUDIOBOT_URL +
            `settings/bot/set/${id}/events.onconnect/${unicodeURLEncode(command)}`,
        )
        .toPromise();

    }
  }

  async remove(id: string) {
    try {
      const bot = await this.findBot(id);
      const enable = bot.Status !== 0 ? true : false;
      if (enable) {
        try {
          await this.httpService
            .get(
              process.env.TS3AUDIOBOT_URL +
                `bot/use/${bot.Id}/(/bot/disconnect)`,
            )
            .toPromise();
        } catch (e) {
          //ignore
        }
      }
      await this.httpService
        .get(process.env.TS3AUDIOBOT_URL + `settings/delete/${id}`)
        .toPromise();
      const rights = await this.tomlReader.readFileAsyncAndParse();
      const newRules = this.rightsParser.removeBot(id, rights.rule);
      rights.rule = newRules;
      await this.tomlReader.writeFileAsync(rights);
      return;
    } catch (e) {
      console.log(e);
      throw new HttpException(
        `Can't remove bot`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async count() {
    try {
      const req = await this.httpService
        .get(process.env.TS3AUDIOBOT_URL + 'bot/list')
        .toPromise();
      const bots = req.data.reduce((acc, bot) => bot.Status === 2 ? {running: acc.running + 1, total: acc.total + 1} :{running: acc.running, total: acc.total + 1}, {running: 0, total: 0})
      return { bots: bots.total, running: bots.running };
    } catch (e) {
      throw new HttpException(
        'TS3AUDIOBOT DOWN',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async on(id: string) {
    await this.httpService
      .get(process.env.TS3AUDIOBOT_URL + `bot/connect/template/${id}`)
      .toPromise();
  }

  async off(id: string) {
    const bot = await this.findBot(id);
    const connected = bot.Status !== 0 ? true : false;
    if (connected) {
      await this.httpService
        .get(
          process.env.TS3AUDIOBOT_URL + `bot/use/${bot.Id}/(/bot/disconnect)`,
        )
        .toPromise();
    }
  }

  private async findBot(id: string): Promise<BotObj> {
    let botList;
    try {
      botList = await this.httpService
        .get(process.env.TS3AUDIOBOT_URL + 'bot/list')
        .toPromise();
    } catch (e) {
      throw new HttpException(
        'Unable to connect to audiobot',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    const findBot = botList.data.filter(res => {
      if (res.Name === id) return res;
    });
    if (findBot.length === 0) {
      throw new HttpException('Bot not found', HttpStatus.NOT_FOUND);
    }
    return findBot[0];
  }
}
