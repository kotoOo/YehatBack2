/* Here is latest ECS code as we understand it, however it is from PropertyLeads Frontends and by this means it is
it Vue Composition API over Vue 2 engine style. We will rewrite it step by step to give an example of proper
backend ECS usage. */

/* Also we're to rewrite it in CommonJS style, to support larger version range of NodeJS */

module.exports = ({ core }) => {
  const { makeLog, uuid } = core;
  const log = makeLog("ECS");

  const { reactive } = require("vue");

  /* The ONE and THE ONLY TRUE AUTHENTHIC ENTITY FACTORY in ZII ECS */
  const Entity = (a = {}) => reactive({
    id: uuid(),
    ...a
  });
  /* --[ Lvl 3 ] -------------------------------------------------- */

  const Entity1 = (a = []) => {
    let b = {};
    for(let key in a) {
      let component = a[key];
      if (Object.keys(component) == 1) {
        let name = Object.keys(component)[0];
        b[name] = component[name];
      } else {
        b = { ...b, ...component }; /* wrong, components are not only objects */
      }
    }

    return reactive({
      id: uuid(),
      ...b
    });
  };

  const loadEntity = (a = [], core) => ({ id, prefix = "yehat1", /* methods = {}, */ exclude = [], specials = [] }) => {
    let initial = {};
    if (id && core) {
      initial = core.db['entities'](id).get();
    }

    //const initial = JSON.parse(localStorage[`${prefix}-${id}`] || "{}");
    let b = { id };
    let fn = [];
    for(let key in a) { /* For each component passed */
      let component = a[key];

      for (let name in component) { /* iterating its keys, in 99% there'll be 1 key with the component name itself */
        if (typeof component[name] == 'object' && !Array.isArray(component[name])) {
          b[name] = { ...(b[name] || {}), ...component[name], ...(initial[name] || {}) }; /* Many mentions of the same component merged */
        } else if (typeof component[name] == 'object' && Array.isArray(component[name])) {
          b[name] = initial[name] || component[name];
        } else {
          b[name] = initial[name] || component[name];
        }
      }
    }

    const en = reactive(b);

    bindMethods({ entity: en, exclude, specials });

    // console.log("Methods bound for", en.meta.name, en);

    // for(let name in methods) {
    //   set(en, name, methods[name](en));
    // }  

    return en;
  };

  /* Components LVL 1 - should work in simple cases, pre component base stage. */
  const Component = (name, structure) => {
    if (typeof structure == 'object') {
      if (Array.isArray(structure)) { /* Array-style component. class B- */
        return (a = []) => ({ 
          [name]: [ ...structure, ...a ] /* naive! should be pureClone */ /* probably very wrong */
        });
      } else { /* Object-style component. class B+ */
        return (a = {}) => ({ 
          [name]: { ...structure, ...a } /* naive! should be pureClone */
        });
      }
    } else {
      return (v) => ({ /* Non-structured component. not too much explored, class D-. */      
        [name]: v || structure
      });
    }
  };
  /* --[ Lvl 1 ] -------------------------------------------------- */

  /* 
    Install enchantments from a[] into Entity e. Enchantments are to land in the Entity itself, be aware not to overwrite
    components: you are within the same namespace with them.

    This is a battle-tested version, was used in Yehat pre Beta I stage. Officially we are yet to introduce enchantments
    in ECS.
  */

  const install = (e) => (a, pool) => {
    a.forEach(fn => {
      const chant = fn(e, pool);
      // console.log("fn(e)", fn(e));
      for(let i in chant) {
        e[i] = chant[i]
        /* Uncomment to get back to Legacy Vue Transition API style */
        // set(e, i, chant[i]);
        /* -------------------------------------------------------- */
      }
      return e;
      //Object.assign(e, fn(e)); /* should be deepmerge */
    });
    
    return e;
  };

  const bindMethods = ({ entity, exclude = [], specials = [] }) => { /* specials - array of method that will get bound to entity root */
    /*                                                                             they must be unique within component namespace!!!
    /* hard built-in methods */
    [ { install } ].map(enchantMethod => {
      const name = Object.keys(enchantMethod)[0];
      const fn = enchantMethod[name];
      entity[name] = fn(entity);
      /* Uncomment to get back to Legacy Vue Transition API style */
      // set(entity, name, fn(entity));
      /* -------------------------------------------------------- */
    });  

    /* component methods */
    let c = 0;
    for(let k in entity) {
      if (~exclude.indexOf(k)) continue;

      let component = entity[k];  
      if (typeof component != 'object' || Array.isArray(component)) continue;    
      
      for (let key in component) {      
        let v = component[key];
        if (typeof v == 'function') {
          if (~specials.indexOf(key)) {
            entity[key] = v(entity);
          } else {
            entity[k][key] = v(entity);
          }
          
          /* Uncomment to get back to Legacy Vue Transition API style */
          // set(entity[k], key, v(entity));
          /* -------------------------------------------------------- */
          c++;
        }
      }
    }

    log("Entity", entity.meta.name, "methods bound", c);

    return entity;
  };

  const Meta = Component('meta', {
    type: "Unknown",
    name: "No name"
  });

  return { Entity, Entity1, loadEntity, Component, install, bindMethods, Meta };
};