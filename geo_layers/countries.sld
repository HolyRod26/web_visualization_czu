<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
 xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd"
 xmlns="http://www.opengis.net/sld"
 xmlns:ogc="http://www.opengis.net/ogc"
 xmlns:xlink="http://www.w3.org/1999/xlink"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <!-- a Named Layer is the basic building block of an SLD document -->
  <NamedLayer>
    <Name>default_polygon</Name>
    <UserStyle>
    <!-- Styles can have names, titles and abstracts -->
      <Title>Polygon with red outline</Title>
      <Abstract>Polygon with red outline</Abstract>
      <!-- FeatureTypeStyles describe how to render different features -->
      <!-- A FeatureTypeStyle for rendering polygons -->
      <FeatureTypeStyle>
        <Rule>
          <Name>rule1</Name>
          <Title>Polygon with red outline</Title>
          <Abstract>Polygon with red outline</Abstract>
          <PolygonSymbolizer>
            <Stroke>
              <CssParameter name="stroke">#bd3939</CssParameter>
              <CssParameter name="stroke-width">2</CssParameter>
            </Stroke>
          </PolygonSymbolizer>
            <TextSymbolizer>
              <Label>
                <ogc:PropertyName>name</ogc:PropertyName>
              </Label>
                <Font>
                  <CssParameter name="font-family">Ubuntu</CssParameter>
                  <CssParameter name="font-size">18</CssParameter>
                  <CssParameter name="font-style">normal</CssParameter>
                  <CssParameter name="font-weight">bold</CssParameter>
                </Font>
                <LabelPlacement>
                  <PointPlacement>
                    <AnchorPoint>
                      <AnchorPointX>0.5</AnchorPointX>
                      <AnchorPointY>0.0</AnchorPointY>
                    </AnchorPoint>
                    <Displacement>
                      <DisplacementX>0</DisplacementX>
                      <DisplacementY>15</DisplacementY>
                    </Displacement>
                  </PointPlacement>
                </LabelPlacement>
              <Halo>
                <Radius>3</Radius>
                <Fill>
                  <CssParameter name="fill">#ffffff</CssParameter>
                </Fill>
              </Halo>
              <Fill>
                <CssParameter name="fill">#bd3939</CssParameter>
              </Fill>
            </TextSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>