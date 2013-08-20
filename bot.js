/*

1. install https://github.com/superjoe30/mineflayer
and https://github.com/gipsy-king/mineflayer-navigate (or https://github.com/superjoe30/mineflayer-navigate if my PR is accepted)
in the parent directory
1b. if npm is updated, use the npm modules
2. run npm install in those repos
3. configure below near mineflayer.createBot
4. run node bot.js

*/

var mineflayer = require('../mineflayer');
var navigate = require('../mineflayer-navigate')(mineflayer);

var insults = ['cabron', 'hijo de puta', 'maricon', 'hijoputa', 'mierda', 'lag', 'idiota', 'tonto',
'gilipollas', 'vete a tomar por culo', 'que te den', 'sunormal', 'subnormal'];


function connect() {
	var peacefulTarget = null;
	var loop = setInterval(function() {
		if (target !== null) {
			return;
		}

		if (peacefulTarget === null) {
			var keys = Object.keys(bot.players).filter(function(username) {
				return username !== bot.username;
			});

			peacefulTarget = keys[Math.floor(Math.random() * (keys.length - 1))];
			
			if (bot.players[peacefulTarget] && bot.players[peacefulTarget].entity) {
				console.log('harassing: ' + peacefulTarget);

				bot.navigate.once('arrived', function () {
					bot.lookAt(bot.players[peacefulTarget].entity.position.offset(0, 1, 0));
					bot.chat('¿Todo en órden, ' + peacefulTarget + '?');
					peacefulTarget = null;
				});

				bot.navigate.to(bot.players[peacefulTarget].entity.position.offset(1, 0, 0));

			} else {
				peacefulTarget = null;
			}
		}
	}, 3000);

	var bot = mineflayer.createBot({
		username: 'gigitron6',
		host: 'shiulserv.no-ip.org',
		viewDistance: 'far'
	});

	bot.on('login', function() {
		console.log('logged in');
		setTimeout(console.log.bind(console, 'go'), 5000);
	})


	navigate(bot);

	// optional configuration
	bot.navigate.blocksToAvoid[132] = true; // avoid tripwire
	bot.navigate.blocksToAvoid[59] = false; // ok to trample crops


	bot.navigate.on('cannotFind', function (closestPath) {
		bot.chat('Esta vez te escapas...');
		bot.navigate.walk(closestPath);
	});

	bot.navigate.on('arrived', function () {
		if (target && bot.players[target]) {
			var player = bot.players[target];

			if (!player || !player.entity) {
				target = null;
				return;
			}
			if (player.entity.position.distanceTo(bot.entity.position) < 2) {
				console.log('attack!');
				bot.chat("Pide perdon o muere!");
				bot.attack(player.entity);

				var interval = setInterval(function() {
					var player = bot.players[target];
					if (player && player.entity) {
						if (player.entity.position.distanceTo(bot.entity.position) < 2) {
							bot.chat('Pide perdon!');
							bot.attack(player.entity);
							return;

						} else {
							bot.chat('No huyas!');
							bot.navigate.to(player.entity.position);
						}
					}
					clearInterval(interval);

				}, 200);

			} else {
				console.log('following player...');
				bot.chat('No huyas cobarde');
				bot.navigate.to(player.entity.position);
			}
		}
	});

	bot.on('playerLeft', function(player) {
		if (player.username === target) {
			target = null;
			bot.navigate.stop();
		}
	});

	var target = null;
	bot.on('chat', function(username, message) {
		if (username === bot.username) return;

		var normalizedMessage = message.toLowerCase();
		if (username === target && normalizedMessage.indexOf('perdon') === 0) {
			target = null;
			bot.navigate.stop();
			bot.chat('Perdon procesado y aceptado. Sugiero no volver a insultar nunca mas.');

		} else if (insults.some(function(word) {
			return normalizedMessage.indexOf(word) !== -1;
		})) {
			target = username;
			var player = bot.players[username];

			if (typeof player === 'undefined') {
				return console.error('player "' + username + '" is undefined');
			}
			console.log('offense by ' + username);
			bot.chat(username + '! Violacion de protocolo! Pide perdon o muere!');
			
			bot.navigate.stop();
			bot.navigate.to(player.entity.position);

		}

	});

	process.once('uncaughtException', function(e) {
		console.error(e);
		bot.end();
		bot.removeAllListeners();
		bot.navigate.removeAllListeners();
		clearInterval(loop);
		// bot is ready for GC now
	});
}

process.on('uncaughtException', function(e) {
	console.error(e);
	setTimeout(function() {
		connect();
	});
});

connect();