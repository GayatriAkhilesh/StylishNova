import {Text, View} from 'react-native';
import {useDimensionContext} from '../../context';
import style from './style';

const EmptyComponent = props => {
  const dimensions = useDimensionContext();
  const responsiveStyle = style(
    dimensions.windowWidth,
    dimensions.windowHeight,
    dimensions.isPortrait,
  );

  return (
    <View style={responsiveStyle.container}>
      <Text style={responsiveStyle.title}>{props.title}</Text>
    </View>
  );
};

export default EmptyComponent;
