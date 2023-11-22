// htapi-import module from Core v1.0b
const elems = [...document.querySelectorAll('[ht-data]')];
const metaElems = new Map();
elems.forEach(el => {
  const source = el.getAttribute('ht-source');
  metaElems.set(source, metaElems.get(source) || document.querySelector(`meta[name="${source}"]`));
});

const extractValue = (data, key, objKey) => {
  let value = data[key];
  if (Array.isArray(value)) {
    return value.map(item => {
      if (objKey && typeof item === 'object' && objKey in item) {
        return item[objKey];
      }
      return typeof item === 'object' ? JSON.stringify(item) : item;
    }).join(', ');
  } else if (objKey && typeof value === 'object') {
    return value[objKey] || '';
  }
  return typeof value === 'object' ? JSON.stringify(value) : value || '';
};

const generateDataBlob = (allData, fullResp) => new Blob(
  [fullResp ? allData : elems.reduce((acc, el) => {
    const key = el.getAttribute('ht-key'),
          src = el.getAttribute('ht-source'),
          objKey = el.getAttribute('ht-obj-key'),
          val = extractValue(allData[src], key, objKey);
    acc[src] = acc[src] || {};
    acc[src][key] = val;
    return acc;
  }, {})], { type: 'application/json' }
);

async function fetchAndConfigure() {
  const allData = {};
  let fullResp = false;
  const fetchPromises = Array.from(metaElems).map(([source, meta]) => {
    fullResp ||= meta.getAttribute('ht-response') === 'true';
    return fetch(meta.getAttribute('ht-import'))
      .then(res => res.json())
      .then(data => {
        allData[source] = data;
      })
      .catch(error => {
        console.error(`Error fetching data from ${source}:`, error);
        allData[source] = {}; // Handle the failed promise with an empty object
      });
  });

  await Promise.all(fetchPromises);

  elems.forEach(el => {
    const source = el.getAttribute('ht-source'),
          key = el.getAttribute('ht-key'),
          objKey = el.getAttribute('ht-obj-key');
    el.setAttribute('ht-value', extractValue(allData[source], key, objKey));
  });

  //ht-data="image" helper applies to video etc
  [...document.querySelectorAll('[ht-data="media"]')].map(element => {
  const htValue = element.getAttribute('ht-value');

  if (htValue) {
    if (element.tagName === 'IMG') {
      element.src = htValue;
      
    } else {
      //need to change for bette compatibility//
      element.style.backgroundImage = `url('${htValue}')`;
       element.src = htValue;
      
    }
   
    
  }
});

}

fetchAndConfigure();

/*htapi helpers 
[...document.querySelectorAll('[ht-data="image"]')].map(element => {

      const htValue = element.getAttribute('ht-value');

      if (htValue) {

        if (element.tagName === 'IMG') {

          element.src = htValue;

        } else {

          element.style.backgroundImage = `url('${htValue}')`;

        }

      }

    });
    */


/* Define in HTML as follows: 
<noscript ht-helper="preloader" type="module" for="htapi">
  window.onload = function() {
  function setBackgroundImageOrImageSrc() {
  const elements = document.querySelectorAll('[ht-data="image"]');
  elements.forEach(el => {
  const imageUrl = el.getAttribute('ht-value');
  if (imageUrl) {
  if (el.tagName.toLowerCase() === 'img') {
  el.src = imageUrl;
  el.style.backgroundImage = `url('${imageUrl}')`;
  } else {
  elements.style.backgroundImage = `url('${imageUrl}')`;
  }
  }
  });
  }
  setBackgroundImageOrImageSrc();
  };
</noscript> 

alt 
<script src="ht-helpers" type="module" for="htapi">

*/
/*ERROR CONDITION: allows loaders only when other element has the oneeror attribte --

    <img src ht-data="image" ht-key="sprites" ht-obj-key="front_default" ht-source="poke-api" onerror="this.src=this.getAttribute('ht-value')"></img>

       <img src ht-data="image" ht-key="sprites" ht-obj-key="front_default" ht-source="poke-api" onerror="this.src=this.getAttribute('ht-value')"></img>*/