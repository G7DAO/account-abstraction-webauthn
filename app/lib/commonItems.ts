export const commonAvatarLayers = {
  accessories: new Array(18)
    .fill(0)
    .map((_, i) => i + 1)
    .map(
      (i) => <AvatarLayerData>[i, `/assets/packs/common/accessories/${i}.png`]
    ),

  clothes: new Array(30)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => <AvatarLayerData>[i, `/assets/packs/common/clothes/${i}.png`]),

  eyebrows: new Array(14)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => <AvatarLayerData>[i, `/assets/packs/common/eyebrows/${i}.png`]),

  eyes: new Array(14)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => <AvatarLayerData>[i, `/assets/packs/common/eyes/${i}.png`]),

  facialHair: new Array(13)
    .fill(0)
    .map((_, i) => i + 1)
    .map(
      (i) => <AvatarLayerData>[i, `/assets/packs/common/facialHair/${i}.png`]
    ),

  hair: new Array(19)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => <AvatarLayerData>[i, `/assets/packs/common/hair/${i}.png`]),

  mouth: new Array(15)
    .fill(0)
    .map((_, i) => i + 1)
    .map((i) => <AvatarLayerData>[i, `/assets/packs/common/mouth/${i}.png`]),

  skin: new Array(12)
    .fill(0)
    .map((_, i) => i + 1)
    .flatMap((i) => [
      <AvatarLayerData>[`${i}a`, `/assets/packs/common/skin/${i}a.png`],
      <AvatarLayerData>[`${i}b`, `/assets/packs/common/skin/${i}b.png`],
    ]),
};

export type AvatarLayerData = [index: number | string, url: string];
