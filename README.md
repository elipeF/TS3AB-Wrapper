# TS3AB-Wrapper

API Gateway for the TS3AudioBot WebAPI

Simple node.js api wrapper for TS3AUDIOBOT with:

- Support of adding rights by UUID/Group
- Start/Stop bot
- Create bot
- Remove bot
- Edit bot
- Enable bot commander on startup
- Set default song on startup
- Set default volume on startup
- Support for bots command alias

# Two types of rights

You can assign two types of rights "admin" or "user" see rights-parser.service.ts

Defaults:
admin

```
'+': '*',
'-': [],
```

user

```
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
```

### Installation

It is recommended to use the image docker with docker image of TS3AUDIOBOT

```docker-compose
version: "3"
services:
  ts3ab:
    image: ancieque/ts3audiobot
    container_name: ts3ab
    volumes:
      - ./ts3ab:/data
    restart: unless-stopped
    networks:
      - app-network

  ts3ab-wrapper:
    image: elipef/ts3ab-wrapper:latest
    container_name: ts3ab-wrapper
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./ts3ab/rights.toml:/usr/src/app/ts3audiobot/rights.toml
    environment:
      PORT: 8080
      TS3AUDIOBOT_URL: http://ts3ab:58913/api/
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

```
