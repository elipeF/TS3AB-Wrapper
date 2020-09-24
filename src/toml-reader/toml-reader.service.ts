import { Injectable } from '@nestjs/common';
import * as util from 'util';
import * as fs from 'fs';
import * as TOML from '@iarna/toml';

@Injectable()
export class TomlReaderService {
  async readFileAsyncAndParse(): Promise<any> {
    const readFileAsync = util.promisify(fs.readFile);
    const rightsFile = await readFileAsync('./ts3audiobot/rights.toml', {
      encoding: 'UTF-8',
    });
    return JSON.parse(JSON.stringify(await TOML.parse.async(rightsFile)));
  }

  async writeFileAsync(content): Promise<void> {
    const parse = TOML.stringify(content);
    const writeAsync = util.promisify(fs.writeFile);
    await writeAsync('./ts3audiobot/rights.toml', parse, { encoding: 'UTF-8' });
  }
}
