function divElementEnostavniTekst(sporocilo) {
  //console.log(sporocilo);
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  var jeYoutube = sporocilo.indexOf('https://www.youtube.com/watch?v=') > -1;
  if (jeSmesko || jeYoutube) {
    sporocilo = sporocilo
    .replace(/\</g, '&lt;')
    .replace(/\>/g, '&gt;')
    .replace('&lt;img', '<img')
    .replace('png\' /&gt;', 'png\' />')
    .replace('jpg\' /&gt;', 'jpg\' />')
    .replace('gif\' /&gt;', 'gif\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function picToImg(link) {
  return $('<a href="'+link+'"><img style="width:200px; margin-left:20px;" src="'+link+'" /></a>');
}

function vrniLinkeSlikIzSporocila(sporocilo) {
  var tabela = sporocilo.match(/(http:\/\/|https:\/\/)\S+(.jpg|.gif|.png)/gi);
  var vrni = [];
  var j = 0;
  for(var i in tabela) {
    vrni[j] = tabela[i];
    //console.log(tabela[i]);
    j++;
  }
  //console.log(vrni);
  return vrni;
}

function pripniSlike(slike) {
  for(i in slike) {
    console.log(i +" "+ slike[i]);
    if(!(slike[i].indexOf("http://sandbox.lavbic.net/teaching/OIS/gradivo/") > -1)) {
      $('#sporocila').append(picToImg(vrniLinkeSlikIzSporocila(slike[i])));
    }
  }
}
function youtubeToIframe(video) {
  return '<iframe style="width:200px; height:150px; margin-left:20px" src="https://www.youtube.com/embed/'+video+'" allowfullscreen></iframe>';
}

function vrniVidejeIzSporocila(sporocilo) {
  var table = sporocilo.match(/(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi);
  for(var i in table) {
    table[i] = table[i].replace(/(?:(?:http|https):\/\/www\.youtube\.com\/watch\?v=)(.{11})/gi, '$1');
  }
  return table;
}

function pripniVideje(table) {
  for(var i in table) {
    $('#sporocila').append(youtubeToIframe(table[i]));
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  var BrezSporocilo = dodajSmeske(sporocilo);
  var tableSlik = vrniLinkeSlikIzSporocila(sporocilo);
  var tableVideo = vrniVidejeIzSporocila(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(BrezSporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
      pripniSlike(tableSlik);
      pripniVideje(tableVideo);
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(BrezSporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(BrezSporocilo));
    pripniSlike(tableSlik);
    $('#sporocila').append(divElementEnostavniTekst(BrezSporocilo));
    pripniVideje(tableVideo);
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);
  
  socket.on('dregljaj', function(rezultat) {
     if(rezultat.dregljaj) {
       //console.log(rezultat.vzdevek);
       //console.log(rezultat.besedilo);
       
       $('#vsebina').jrumble();
       $('#vsebina').trigger('startRumble');
       setTimeout(function() {
         $('#vsebina').trigger('stopRumble');
       }, 1500);
       
     }
  });

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    pripniSlike(vrniLinkeSlikIzSporocila(sporocilo.besedilo));
    pripniVideje(vrniVidejeIzSporocila(sporocilo.besedilo));
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
    
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {
      $('#poslji-sporocilo').val('/zasebno "' + $(this).html() + '" ').focus;
    }); 
    
  });
  
  

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img class=\"smesko\" src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}