var flight = require('./flight');

var pdxlax = {
	number: 847,
	origin: 'PDX',
	destination: 'LAX'
};

var pl = flight(pdxlax);

pl.triggerDepart();

console.log(pl.getInformation());

var ausdca = {
	number: 382,
	origin: 'AUS',
	destination: 'DCA'
};

var ad = flight(ausdca);

console.log(ad.getInformation());

console.log(pl.getInformation());

// give me the total flights
console.log(flight.getCount());

// also give me the list of flights served
console.log(flight.getDestinations());
