#!/bin/sh
CWD=$PWD
SDIR=$(dirname $0)
cd $SDIR

cat sockjs-0.3.min.js \
		box2d.js \
		caat.js \
		Utils.js \
		Constant.js \
		Msg.js \
		DirectorBase.js \
		DirectorClient.js \
		Entity.js \
		Projectile.js \
		Effect.js \
		Skill.js \
		Virus.js \
		Cell.js \
		Client.js \
		PowerUp.js \
		> combine-client-code.js	

	
cd $CWD