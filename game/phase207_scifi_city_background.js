import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-207-SCIFI-CITY-BACKGROUND-LOCK";
const CITY_JPEG_B64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABcQERQRDhcUEhQaGBcbIjklIh8fIkYyNSk5UkhXVVFIUE5bZoNvW2F8Yk5QcptzfIeLkpSSWG2grJ+OqoOPko3/2wBDARgaGiIeIkMlJUONXlBejY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY3/wAARCABwAYADASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAABAACAwUGAQf/xABDEAABBAAEAgYHBQYEBgMAAAABAAIDEQQSITEFQRMiMlFhcQYUgZGhscEVIyRC0SUzNFJicjVz4fAWNkOCssJjkqL/xAAYAQEBAQEBAAAAAAAAAAAAAAAAAQIDBP/EACERAQACAgMAAwEBAQAAAAAAAAABERJhAhMhAzFBIkJR/9oADAMBAAIRAxEAPwDKpLY4bV0/hIVNS79W3Kfk0xCS29JUr1bOzTEJLb0lSdWzs0xCS29JUnVs7NMQktvSVJ1bTs0xCS29ITHzGOMx5bD21d7KdW1j5L/GTSWxwb+kwzSdx1T7FLmp4anVsz0xKS3bXkLpksJ1bOxg0luKSpTq2dmmHSW3pKlerZ2aYhJbekqTq2dmmISW2pKlOrZ2aYlJbalwDdOvZ2aYpJa3FSOie0tIGmx5/BLAyiWHKZA6RvaFVXcphF1a5+XTJJLbEaJnFz+AxF69Y7+Szy44tceWTGJLa4OxFFVX0Yq/JZ6ON8riHCshzEEJyipo4zcKtJeolsZTDGzkSpSZPMUl6VMI4onve6mtBJJ5BJoa9jXMNtcLB7wrjBk81SXpeRLo1cUzeaJL0vo/BLJ4FMdmbzRJel5E4RjuCmK5PMkl6gI2c2n3rvQxnkVPFuXlyS9R6CPxXDAzvKeFy8vSXp/q7e9dGHZztPC5/wCM5w17p5JgBZPXNIzMM2Xn3KnwbiyVxBIFHbmrPAtdLjyzQjJYC9F1LE8UrtGk9wTWG4w4lE4nCyNhkdl0DSd/BDGN32aZCOqWnVayhjHw2R5a+INqnuo+5S0guISOiEDQCCW5wfZSOhjeYI3EE20G/YraTHjlJUlm++MfMCyn5VbSjKUb5GRuAeQ0EXZKnyqs4m8FwbRthoqTKxFyIZOXYx8JAoDQqv4k4yPa7KBlbR18SiDKGcSe9tEGgPaAg8Y4+syNNdUkDmDqVmZdOMUJw0nRYBhGv3h5+CKH8Y0f0A/BBhuXhUR5mUj4I4Bp4kytAYgfmpZR85LYXEGiK+alyqDiLuigGWjmcAnzzuhxOHDTo4kOHfst2xSQtI3C5Ss5ICRoAUG6FwOjDuuccoknjSCkqUpjcPyn3JuQjkfctWlGUuUnM67cwBoruVCjKSpPpKlUDYuQwwFwq9haBwmMlkxzISW5HNcSAO5GcRH4U76OCrcCP2tCNew/muMz/cOsR/MjMeDmbQJ05X9EJwoftGX/ACvqjOJN6zbH5eYH1KG4LHn4rI1tfuvDv8FP9r/lakaKDjH8BPr+Y/8Aij+hBbmDgQRoRzVfxj+Bn8//AFT5JuYPjj7SxEswzXAWWx3XsVKxz5JHvdo5zSfNaKKFphALqAj+iy8Jb0DXsbTtWnxCnP7Xh9N10v4wwZf+mH5vbVKbKhSQOMAWLMB08nD9UWsNVAPirf2Viv8AKd8k7h4vhuFOn7pnyC7xGncOxLeZhfp7FX+j2Kd9jPlneXNiNd9NDRor+FLfIFwNBAI2Kh4hOIeHTTBucBmgBq7UmE1wkJ/+NvyUKg/IFxha9ocxwcDzBsIPjbnN4ZLlJFijR8FFwaeKHhGBZI4NMoLWeJsoVCzpQ4yduFwkkzvyjkOewU6pvSbFmDBNgDAenNE3tRBSBcDbZdSBsBJRSUGKnMAioA9JK1mvip1X8Te3p8E2xfrDSRe2h/UKwg18jYywOJ67so809CYyRgxOEYXC+lvLevZI+ZTOKzvhijEb8maRoJ7hYQZfDtzOdrVNJ+CtuEuP2lYF/dKlw9OlIcL6rj8FY8Pn6DGxvd1QDldfdS9HKGV7jsVFHh5WSPax5jNNJ12VXi5A7gMLRrTwL96H4vKzF4kyxm2NYG2OZBT3vb9iMjN2ZC4ewLERVKH4lM2QYUD8sIFq44RO93DoW5Q4gEanxWYledfAaK14NO4YyKN2rAxwAr2rUx4kpIMQ6XisjxoJDVHlt+isZXF2EMzQzKTuPOlS4I3i83e4lGOn/ARwtcQ67I0qrP6KzCUZxCcujDcuUiRw0/p0+qrcUyi12uu5vmuySve8ZnkkuJPmd0zFONijZVWINYQ19+SZLIJZM17CtUQGZYXjvyny/wB2gjsp9g3ps/D4mBhGWTV1iiaU7sVkmEzAHFkYaRytBxyAwwx0eq5xPjdJ7uxN5hWSj8Tj34ktjcxrQNdLT5sU6VsRd22XqOfcgmFgxH3hptKeRzTRGt8/Yl+pUNl0red+5C4LGMxMT3N/LI4fUfAqTiUnQ8OxDxoRGaVR6PSgYvGRE2KY4V5V+i88Ku87UySRmR3kVL1D3Kt45L0GEBjJa4mraa5KwhcPmjj4ZG6TXKDmPtKLBY4aRk+xUWCxGfAYiIt7Ia4O89PorzCyxyh5a4jK4jTXmtEwY5rembH0fWcLUWIdHh3xtkYW9IaBtMxcwi4zhi6QhpbVnbXNuh/SEuMbASDodkykxgLxg5MT0Yc7YEsqx5ofg7c3HIAR/wBN/LwU/HGPGMDjqDG0XSBwuIdgsWzFRtDnsaQGkEA2sTPttxHi04vJG97CzYZm60NjXMKilc+EyvjkLS9mQ0eXuRnrUs0AkNuskhosVZJOyDxTnFrszSPa76p+o0WBcfsnDuOwhHyQvGXZcBNYOp5D+lHYCM/YOHcaoxAboHi9+pS3f+wrzm5g4xVuDjeG6GonSA5avIqWPqRhhbRbdnvNI/jGFmkwUOOqmSxh7mts5R1R9VUwODWuAdmv4KTNysRUNiHn/isgkV0dD3AqyGNidhJcQzM5keaxVHq7/JZyDFdF6QzYiXM7K991qaohExY9jeGzxBjj00sjQdqsWFZ4pYfiGJcOHYKYvcHSRPbYO9ubd+y1JwOQO4HjohuA4+9tfRV+PeTwzh7T2QwkeeY/oooMRLBgJWxOyiSUNdpuKKtC9x+Nz8NbAwAskwme+dggI7BYrNNh8OOz6o2Swd9QPosxjJxJh8KxtgxxZHUd9UZ6NSOPFpGucSGw5WgnYWNAkx4WsuPzuAEIIyOje4jxFfqgA4jgnB3A69K35qHEyul9akc4HI+QAXehLVB0zx6OYU5zmjmcWeFVSkQraqg9KBmfgxV9Y/RXMMhfBG9x1c0E+5UHpS8iWDct6J9/AKRHpax9GyTwSEuJJzO3/uKtFS+i+IZJwkRNJzxOIcD4mwrm1J+x1ZjHy9J6RNa0ghr2D4i1o5ZRHC97tmtJPuWQ9YZJxkYhxqIyB4J5C7WuMErTEy9L6RxN2DHAfVV+LxBxZxUozZXytDc3IJj8Q9mOM5d94etm8xp80yM/gB4z38FqqRHhwelOUjRhJJ8lM5wa6TMdcx5IZmj99wVK42y+8ldZQoicrBZXHOdlqz5Wux9li4SopmMaxspETi5tDU+X6ojCzuw8zZGAFwaQL8RSFkNhxKkaTkaedKyiaB+RwJ1yqB7iZHOA0vUKQENa4nkozYvmgYCQ6+QJTiS5vOymN7Av2p40bSg7BoZB/SPmoNwpozQlI/lHzUIBrwKsCRhJe0knw18lK40XtGzioohUgAKlkH3igGmFP3u1OzVmvIaIeR2aQnxRLSBECeYVGq41N6vwuZ1XmGSj46Kj9FcTmx88Ja0CRgd49Wh9VZelTsvCaveQfIrO+j07MPxZr5HZWljgT3Lzx9K1eKe9nE8HG1xDH5szRsdChvSSm4Bug7f0VX63iJJI3ySuc6Oi0ncaoz0jMZnjyk9K0dYDu5K/pQLh+uFxVkH7tvwtWvo2R6rMTX7z/wBQqXBuIhxJJH7uviVPhW9FDCXUAzEslcf6aarIf6Udt/k1DmXNwbBMN2yK7J7youIHNhJHEk2+wSk2aJ+Aw8bJBnbC2xdVqsKCne4SRU46vo6lSkjw95UeJH3kFm+v/MpnUO//AO6iu4cdptAg9YaXXI81Dim006fAfqpoSBILrsHcjv8AFQ4sjKaI/wDz9FYRqsH/AMtYX/LYhcYbGNa7VvRnQ+SXDOIRT8GiwrGv6SNgBJGmlJuPzN9dIaT1Na5aKT9tQ7LOx3BMJGwtfWF62U2W0G7hZUsa0dU3YG3kjeGSGGCR7Is9WcwNVoPehXXeUWAN6KqLLGPMXEsS5pF53DbvURmcCADp2q8apPxgeXdPJRMhs1v7UOXgt0FUF1YNxErniJjj1Y25W++04OaMM9mzukDgPAX+qhl3Cc0ghx5kOUVJYzmhYq79iJ4TiThMViZmtDi2EkAnxCELgZD5fRKBx6SbLsY3XSAuFwbgpCbLpTr4ahMe2uCRDukkHxC4wj1RoJ3OnvCU0g+zhFzEjz8VP0a/Du/DRf2N+SpvSCRk7QxjgXNBDhextWkDvw8f9jfksrxOV32rMDrlkNUrMJA/0TcRiMSL0yNPxWnzLJ+jjzGcY8btisfFFM43OCM/RG6NURolAvj2N6PCyYcA29lk3y/2Fm23labHZB3U/EsUZ8xcbJc4A+F/6oVhzMB7gkAgymR+Y71qpIn5oAyuw8vJJQ7ATYG5Xcl4cEXq7u8FZWGjEGHblAjjrM0XQ2rVC8ZgjY2N+HygUQWt7+9MZioWYrpQyQus6FgrYDv8FzEz4eZ1TNkAHdH4+akXEqEije5rS1pNb+CjcDVAa9ymMOCkdmbLMwDkWX9V14w7SSzEygXoOjNrdpQSRrgHWDv3J7byN8lORhzQfPI7T+QhdAwg6ocT3Xf6JZSMMe+N4Y0u0Oya5rg4gtI8wlMyOV2Zj2truBC50ZbF/EtBvfOVbERNNN96eDbdOakdTizLOxjfzfe380Rh5WQykPxDXRV/OBZ8gpMgFvZl/tHzR+CwsToIOlYC6R5cSf5QoJsTCZCY5dhoaJ56IluJBiPq8xc8agAkcx3+FqTM0JIYMP0bH9E234gN/wC3uTpcLFJhsaWMHSQuJaR3b181FE6RrWtt3aJAG9Xv7k5pxtyAukAI0FDrakfKln1VJeoRYeBCG1/9k=";

function syncLabel(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE207 = { build: LABEL, active: true, scifiCityBackground: true, secondFloorVisible: true, source: "uploaded scifi city.zip" };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function addPlane(root, name, material, width, height, x, y, z, rotY){
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material.clone());
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.renderOrder = -4;
  root.add(mesh);
  return mesh;
}

function addGlowBlocks(root){
  const mat = new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:0.20, depthWrite:false });
  for(let i=0;i<22;i++){
    const h = 1.2 + (i%5)*0.55;
    const w = 0.35 + (i%3)*0.16;
    const x = -17.5 + i*1.65;
    const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,0.08), mat.clone());
    b.name = `PHASE207_CITY_DISTANT_LIGHT_TOWER_${i+1}`;
    b.position.set(x, 6.35 + h*.5, -22.25 - (i%4)*0.36);
    root.add(b);
  }
}

function installCity(){
  syncLabel();
  const scene = window.__SVR_SCENE__;
  if (!scene || window.SVR_PHASE207_CITY_INSTALLED) return false;
  const old = scene.getObjectByName("PHASE207_SCIFI_CITY_BACKGROUND_ROOT");
  if (old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = "PHASE207_SCIFI_CITY_BACKGROUND_ROOT";
  scene.add(root);
  const tex = new THREE.TextureLoader().load(`data:image/jpeg;base64,${CITY_JPEG_B64}`, ()=>{ tex.needsUpdate = true; });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const cityMat = new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, depthWrite:false, fog:false });
  addPlane(root,"PHASE207_CITY_NORTH_SECOND_FLOOR_VISIBLE",cityMat,42,7.8,0,8.85,-23.6,0);
  addPlane(root,"PHASE207_CITY_WEST_ANGLE_SECOND_FLOOR_VISIBLE",cityMat,20,7.0,-23.2,8.55,-16.7,Math.PI/2.7);
  addPlane(root,"PHASE207_CITY_EAST_ANGLE_SECOND_FLOOR_VISIBLE",cityMat,20,7.0,23.2,8.55,-16.7,-Math.PI/2.7);
  addGlowBlocks(root);
  window.SVR_PHASE207_CITY_INSTALLED = true;
  return true;
}

syncLabel();
let tries = 0;
const timer = setInterval(()=>{ tries++; if (installCity() || tries > 80) clearInterval(timer); }, 250);
setTimeout(installCity,1000);
setTimeout(installCity,2500);
