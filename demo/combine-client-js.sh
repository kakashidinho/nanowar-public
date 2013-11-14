#!/bin/sh
CWD=$PWD
DEMO_DIR=$(dirname $0)
SOURCE_DIR=$DEMO_DIR/../src
cd $SOURCE_DIR

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

cpy $SOURCE_DIR/combine-client-code.js $DEMO_DIR/combine-client-code.js