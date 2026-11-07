export const layers = {
 weather: [{id:'IMERG_Precipitation_Rate',name:'Rainfall',unit:'mm/hr',source:'GPM · IMERG',note:'Satellite precipitation estimate. Daily imagery; processing delay applies.'}],
 forest: [{id:'MODIS_Terra_NDVI_8Day',name:'Vegetation greenness',unit:'NDVI',source:'MODIS · Terra',note:'Eight-day vegetation composite. Greenness is not a direct measure of deforestation.'}],
 ocean: [{id:'MODIS_Aqua_L2_Sea_Surface_Temp_Day',name:'Surface temperature',unit:'°C',source:'MODIS · Aqua',note:'Daytime sea surface temperature. Clouds and missing overpasses leave gaps.'},{id:'VIIRS_SNPP_L2_Sea_Surface_Temp_Day',name:'VIIRS surface temperature',unit:'°C',source:'VIIRS · Suomi NPP',note:'Surface temperature retrievals; coverage varies by overpass and cloud conditions.'}],
 air: [{id:'MODIS_Terra_Aerosol_Optical_Depth_3km',name:'Aerosol optical depth',unit:'AOD',source:'MODIS · Terra',note:'Atmospheric particle loading, not surface AQI or measured PM2.5.'},{id:'OMI_Nitrogen_Dioxide_Tropo_Column',name:'Nitrogen dioxide',unit:'column NO₂',source:'OMI · Aura',note:'Tropospheric column concentration, not ground-level exposure.'}],
} as const;
export type Category=keyof typeof layers;
export const allowedLayers: string[]=Object.values(layers).flat().map(x=>x.id);
