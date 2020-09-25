import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Rights } from 'src/rights';
import { Right } from 'src/right';
import { RightsRequest } from 'src/rights-request';

interface NewRight {
  bot: string[];
  rule: { [index: number]: Right };
}

@Injectable()
export class RightsParserService {
  private content: NewRight = {
    bot: [],
    rule: [
      {
        useruid: [],
        groupid: [],
        '+': '*',
        '-': [],
      },
      {
        useruid: [],
        groupid: [],
        '+': [
          'cmd.play',
          'cmd.pause',
          'cmd.stop',
          'cmd.seek',
          'cmd.volume',
          'cmd.list.*',
          'cmd.add',
          'cmd.clear',
          'cmd.previous',
          'cmd.next',
          'cmd.random.*',
          'cmd.repeat.*',
          'cmd.history.add',
          'cmd.history.from',
          'cmd.history.id',
          'cmd.history.last',
          'cmd.history.play',
          'cmd.history.till',
          'cmd.history.title',
        ],
        '-': [],
      },
    ],
  };

  addNewBot(id: string): Rights {
    const rights: Rights = JSON.parse(JSON.stringify(this.content));
    rights.bot.push(id);
    return rights;
  }

  removeBot(id: string, rights: Rights[]): Rights[] {
    const index: number = rights.findIndex((el: Right) => {
      if (el.bot) {
        return el.bot.includes(id);
      }
    });
    if (index > 0) {
      rights.splice(index, 1);
      return rights;
    } else {
      throw new Error();
    }
  }

  addRight(id: string, request: RightsRequest, rights: Rights[]): Rights[] {
    const index: number = this.findBotIndex(rights, id);
    const { level, ...props } = request;

    for (const type of Object.keys(props)) {
      if (level === 'admin') {
        rights[index].rule[0][type].push(props[type]);
      } else {
        rights[index].rule[1][type].push(props[type]);
      }
    }

    return rights;
  }

  removeRight(id: string, request: RightsRequest, rights: Rights[]): Rights[] {
    const index: number = this.findBotIndex(rights, id);
    const { level, ...props } = request;

    for (const type of Object.keys(props)) {
      if (level === 'admin') {
        const indexOfRight = rights[index].rule[0][type].indexOf(props[type]);
        if (indexOfRight !== -1) {
          rights[index].rule[0][type].splice(indexOfRight, 1);
          return rights;
        } else {
          throw new HttpException('Right not exist', HttpStatus.NOT_FOUND);
        }
      } else {
        const indexOfRight = rights[index].rule[1][type].indexOf(props[type]);
        if (indexOfRight !== -1) {
          rights[index].rule[1][type].splice(indexOfRight, 1);
          return rights;
        } else {
          throw new HttpException('Right not exist', HttpStatus.NOT_FOUND);
        }
      }
    }
  }

  private findBotIndex(rights: Rights[], id: string): number {
    const index: number = rights.findIndex((el: Right) => {
      if (el.bot) {
        return el.bot.includes(id);
      }
    });
    if (index > 0) {
      return index;
    }
    throw new HttpException('Not in rights file', HttpStatus.NOT_FOUND);
  }
}
