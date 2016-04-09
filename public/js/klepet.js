var Klepet = function(socket) {
  this.socket = socket;
};

Klepet.prototype.posljiSporocilo = function(kanal, besedilo) {
  var sporocilo = {
    kanal: kanal,
    besedilo: besedilo
  };
  this.socket.emit('sporocilo', sporocilo);
};

Klepet.prototype.spremeniKanal = function(kanal) {
  this.socket.emit('pridruzitevZahteva', {
    novKanal: kanal
  });
};

Klepet.prototype.procesirajUkaz = function(ukaz) {
  var besede = ukaz.split(' ');
  ukaz = besede[0].substring(1, besede[0].length).toLowerCase();
  var sporocilo = false;

  switch(ukaz) {
    case 'pridruzitev':
      besede.shift();
      var kanal = besede.join(' ');
      this.spremeniKanal(kanal);
      break;
    case 'vzdevek':
      besede.shift();
      var vzdevek = besede.join(' ');
      this.socket.emit('vzdevekSpremembaZahteva', vzdevek);
      break;
    case 'zasebno':
      besede.shift();
      var besedilo = besede.join(' ');
      var parametri = besedilo.split('\"');
      if (parametri) {
        this.socket.emit('sporocilo', { vzdevek: parametri[1], besedilo: parametri[3] });
        sporocilo = '(zasebno za ' + parametri[1] + '): ' + parametri[3];
      } else {
        sporocilo = 'Neznan ukaz';
      }
      break;
    case 'dregljaj':
      //console.log('dregljaj!!');
      //console.log('besede: '+besede);
      //console.log('besedilo: '+besedilo);

      //console.log(besede.length);
      if(besede.length == 2) {
        //console.log("user: "+user[1]);
        this.socket.emit('dregljaj', { vzdevek: besede[1], sporocilo: 'drek'});
        sporocilo = "<b>Dregljaj za " + besede[1] + "</b>";
      }
      else {
        sporocilo = '<b>Neznan ukaz!!!</b>';
      }
      break;
    default:
      sporocilo = 'Neznan ukaz.';
      break;
  };

  return sporocilo;
};
