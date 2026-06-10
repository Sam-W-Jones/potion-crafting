// =============================================
// Potion Crafting Module - main.js (V12)
// =============================================

const POTIONS = [
  {
    name: "Potion of Healing",
    cost: 25,
    img: "icons/consumables/potions/potion-round-empty-red.webp",
    description: "Regains 2d4+2 hit points when drunk."
  },
  {
    name: "Potion of Greater Healing",
    cost: 100,
    img: "icons/consumables/potions/potion-round-empty-red.webp",
    description: "Regains 4d4+4 hit points when drunk."
  },
  {
    name: "Potion of Superior Healing",
    cost: 500,
    img: "icons/consumables/potions/potion-round-empty-red.webp",
    description: "Regains 8d4+8 hit points when drunk."
  },
  {
    name: "Potion of Supreme Healing",
    cost: 5000,
    img: "icons/consumables/potions/potion-round-empty-red.webp",
    description: "Regains 10d4+20 hit points when drunk."
  },
  {
    name: "Potion of Climbing",
    cost: 75,
    img: "icons/consumables/potions/potion-round-empty-blue.webp",
    description: "Grants a climbing speed equal to walking speed for 1 hour."
  },
  {
    name: "Potion of Water Breathing",
    cost: 180,
    img: "icons/consumables/potions/potion-round-empty-blue.webp",
    description: "Grants water breathing for 1 hour."
  }
];

// V12 uses ActorSheet5eCharacter2 as the default sheet
const SHEET_HOOKS = [
  "renderActorSheet5eCharacter",
  "renderActorSheet5eCharacter2"
];

SHEET_HOOKS.forEach(hookName => {
  Hooks.on(hookName, (app, html, data) => {
    const actor = app?.actor;
    if (!actor) return;

    // Avoid duplicate buttons on re-render
    if (html.find(".potion-craft-btn").length) return;

    const headerElement = html.find(".window-header .window-title");
    if (!headerElement.length) return;

    const button = $(`
      <a class="potion-craft-btn" title="Craft Potion">
        <i class="fas fa-flask"></i> Craft Potion
      </a>
    `);

    headerElement.after(button);
    button.on("click", () => openCraftingDialog(actor));
  });
});

function openCraftingDialog(actor) {
  const potionRows = POTIONS.map((potion, index) => `
    <div class="potion-row" data-index="${index}">
      <img src="${potion.img}" alt="${potion.name}" />
      <div class="potion-info">
        <strong>${potion.name}</strong>
        <span>${potion.description}</span>
      </div>
      <div class="potion-cost">
        <i class="fas fa-coins"></i> ${potion.cost} gp
      </div>
      <button class="craft-btn" data-index="${index}">Craft</button>
    </div>
  `).join("");

  const content = `
    <div class="potion-crafting-dialog">
      <p class="gold-display">
        Your gold: <strong>${getActorGold(actor)} gp</strong>
      </p>
      <div class="potion-list">
        ${potionRows}
      </div>
    </div>
  `;

  new Dialog({
    title: "Potion Crafting",
    content: content,
    buttons: {
      close: { label: "Close" }
    },
    render: (html) => {
      html.find(".craft-btn").on("click", (event) => {
        const index = $(event.currentTarget).data("index");
        craftPotion(actor, POTIONS[index], html);
      });
    }
  }, {
    classes: ["potion-crafting-window"],
    width: 480
  }).render(true);
}

async function craftPotion(actor, potion, dialogHtml) {
  const currentGold = getActorGold(actor);

  if (currentGold < potion.cost) {
    ui.notifications.warn(
      `Not enough gold! ${potion.name} costs ${potion.cost} gp but you only have ${currentGold} gp.`
    );
    return;
  }

  await setActorGold(actor, currentGold - potion.cost);

  const itemData = {
    name: potion.name,
    type: "consumable",
    img: potion.img,
    system: {
      description: { value: potion.description },
      consumableType: "potion",
      quantity: 1,
      weight: { value: 0.5 },
      price: { value: potion.cost, denomination: "gp" },
      rarity: "common",
      uses: { value: 1, max: "1", per: "charges", autoDestroy: true }
    }
  };

  await actor.createEmbeddedDocuments("Item", [itemData]);

  ui.notifications.info(
    `${actor.name} crafted a ${potion.name} for ${potion.cost} gp!`
  );

  dialogHtml.find(".gold-display strong").text(`${getActorGold(actor)} gp`);
}

function getActorGold(actor) {
  return actor.system.currency.gp ?? 0;
}

async function setActorGold(actor, newAmount) {
  await actor.update({ "system.currency.gp": newAmount });
}
